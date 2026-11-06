// HTTP/TLS transport for Samsung's Tizen Sockets Extension. Runs only in a worker.
#include <curl/curl.h>
#include <sys/socket.h>
#include <unistd.h>
#ifndef NET_CA_FILE
#define NET_CA_FILE "/cacert.pem"
#endif
#include <vector>
#include <string>
#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <cstring>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define API EMSCRIPTEN_KEEPALIVE
#else
#define API
#endif
namespace {
std::vector<unsigned char> body;
std::string responseHeaders,errorText,report,metrics;
const size_t MAX_BODY=16*1024*1024;
struct Reply {std::vector<unsigned char> bytes;size_t limit=65535;};
size_t collect(char* data,size_t size,size_t count,void* context){auto& reply=*static_cast<Reply*>(context);size_t n=size*count;if(n>reply.limit-reply.bytes.size())return 0;reply.bytes.insert(reply.bytes.end(),data,data+n);return n;}
size_t headers(char* data,size_t size,size_t count,void*){size_t n=size*count;if(responseHeaders.size()+n>65536)return 0;responseHeaders.append(data,n);return n;}
void secure(CURL* handle){
 curl_easy_setopt(handle,CURLOPT_SSL_VERIFYPEER,1L);curl_easy_setopt(handle,CURLOPT_SSL_VERIFYHOST,2L);
 curl_easy_setopt(handle,CURLOPT_SSLVERSION,CURL_SSLVERSION_TLSv1_2);curl_easy_setopt(handle,CURLOPT_CAINFO,NET_CA_FILE);curl_easy_setopt(handle,CURLOPT_CONNECTTIMEOUT_MS,3500L);
 curl_easy_setopt(handle,CURLOPT_NOSIGNAL,1L);curl_easy_setopt(handle,CURLOPT_PROTOCOLS,CURLPROTO_HTTP|CURLPROTO_HTTPS);
 curl_easy_setopt(handle,CURLOPT_FOLLOWLOCATION,0L);
}
std::string encode(const std::vector<unsigned char>& data){const char* table="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";std::string result;unsigned value=0;int bits=0;for(unsigned char ch:data){value=(value<<8)|ch;bits+=8;while(bits>=6){bits-=6;result+=table[(value>>bits)&63];}}if(bits)result+=table[(value<<(6-bits))&63];return result;}
std::vector<unsigned char> question(const std::string& host){std::vector<unsigned char> out={0,0,1,0,0,1,0,0,0,0,0,0};size_t start=0;while(start<host.size()){size_t end=host.find('.',start);if(end==std::string::npos)end=host.size();size_t size=end-start;if(!size||size>63)return {};out.push_back(size);out.insert(out.end(),host.begin()+start,host.begin()+end);start=end+1;}out.insert(out.end(),{0,0,1,0,1});return out;}
unsigned word(const std::vector<unsigned char>& b,size_t o){return (unsigned(b[o])<<8)|b[o+1];}
bool parse(const Reply& reply,const std::vector<unsigned char>& q,std::vector<std::string>& addresses,unsigned& ttl){
 addresses.clear();ttl=600;
 const auto& b=reply.bytes;if(b.size()<q.size()||b.size()<12||word(b,0)!=0||(word(b,2)&0x820f)!=0x8000||word(b,4)!=1||!std::equal(q.begin()+12,q.end(),b.begin()+12))return false;
 unsigned count=word(b,6);if(count>128)return false;size_t pos=q.size();
 for(unsigned i=0;i<count;i++){
  bool ended=false;for(int steps=0;steps<128&&pos<b.size();steps++){unsigned len=b[pos++];if(!len){ended=true;break;}if((len&0xc0)==0xc0){if(pos>=b.size())return false;pos++;ended=true;break;}if(len>63||pos+len>b.size())return false;pos+=len;}if(!ended||pos+10>b.size())return false;
  unsigned type=word(b,pos),kind=word(b,pos+2),len=word(b,pos+8);if(pos+10+len>b.size())return false;
  if(type==1&&kind==1&&len==4){
   unsigned first=b[pos+10],second=b[pos+11];
   bool publicIp=first!=0&&first!=10&&first!=127&&first<224&&!(first==169&&second==254)&&!(first==172&&second>=16&&second<=31)&&!(first==192&&second==168);
   if(publicIp){ttl=std::min(ttl,(unsigned(b[pos+4])<<24)|(unsigned(b[pos+5])<<16)|(unsigned(b[pos+6])<<8)|b[pos+7]);std::string ip=std::to_string(first)+"."+std::to_string(second)+"."+std::to_string(b[pos+12])+"."+std::to_string(b[pos+13]);if(addresses.size()<8&&std::find(addresses.begin(),addresses.end(),ip)==addresses.end())addresses.push_back(ip);}
  }pos+=10+len;
 }return !addresses.empty();
}
}
extern "C" {
API int net_probe(){int fd=socket(AF_INET,SOCK_STREAM,0);if(fd<0)return -1;close(fd);return 0;}
API int net_init(){return int(curl_global_init(CURL_GLOBAL_DEFAULT));}
API const char* net_error(){return errorText.c_str();}
API const unsigned char* net_body(){return body.empty()?nullptr:body.data();}
API int net_size(){return int(body.size());}
API const char* net_headers(){return responseHeaders.c_str();}
API const char* net_report(){return report.c_str();}
API const char* net_metrics(){return metrics.c_str();}
API int net_request(const char* url,const char* method,const char* headerLines,const unsigned char* payload,int payloadSize,const char* host,int port,const char* ip,int timeout){
 body.clear();responseHeaders.clear();errorText.clear();metrics="{}";CURL* handle=curl_easy_init();if(!handle)return -1;secure(handle);
 Reply reply;reply.limit=MAX_BODY;curl_easy_setopt(handle,CURLOPT_URL,url);curl_easy_setopt(handle,CURLOPT_TIMEOUT_MS,long(std::min(15000,std::max(100,timeout))));
 curl_easy_setopt(handle,CURLOPT_WRITEFUNCTION,collect);curl_easy_setopt(handle,CURLOPT_WRITEDATA,&reply);curl_easy_setopt(handle,CURLOPT_HEADERFUNCTION,headers);
 curl_easy_setopt(handle,CURLOPT_ACCEPT_ENCODING,"");
 curl_slist* forced=nullptr;curl_slist* list=nullptr;
 if(ip&&*ip){std::string entry=std::string(host)+":"+std::to_string(port)+":"+ip+":"+std::to_string(port);forced=curl_slist_append(nullptr,entry.c_str());curl_easy_setopt(handle,CURLOPT_CONNECT_TO,forced);}
 std::string lines=headerLines?headerLines:"";size_t start=0;while(start<lines.size()){size_t end=lines.find('\n',start);if(end==std::string::npos)end=lines.size();std::string line=lines.substr(start,end-start);if(line.find('\r')!=std::string::npos){errorText="Invalid header";curl_easy_cleanup(handle);curl_slist_free_all(forced);curl_slist_free_all(list);return -1;}if(!line.empty())list=curl_slist_append(list,line.c_str());start=end+1;}
 curl_easy_setopt(handle,CURLOPT_HTTPHEADER,list);
 if(std::strcmp(method,"POST")==0){curl_easy_setopt(handle,CURLOPT_POST,1L);curl_easy_setopt(handle,CURLOPT_POSTFIELDS,payload);curl_easy_setopt(handle,CURLOPT_POSTFIELDSIZE,long(payloadSize));}
 else if(std::strcmp(method,"HEAD")==0)curl_easy_setopt(handle,CURLOPT_NOBODY,1L);
 else if(std::strcmp(method,"GET")!=0){errorText="Unsupported method";curl_easy_cleanup(handle);curl_slist_free_all(forced);curl_slist_free_all(list);return -1;}
 char error[CURL_ERROR_SIZE]={0};curl_easy_setopt(handle,CURLOPT_ERRORBUFFER,error);CURLcode result=curl_easy_perform(handle);long status=0;curl_easy_getinfo(handle,CURLINFO_RESPONSE_CODE,&status);
 double lookup=0,connect=0,tls=0,firstByte=0,total=0;
 curl_easy_getinfo(handle,CURLINFO_NAMELOOKUP_TIME,&lookup);curl_easy_getinfo(handle,CURLINFO_CONNECT_TIME,&connect);curl_easy_getinfo(handle,CURLINFO_APPCONNECT_TIME,&tls);curl_easy_getinfo(handle,CURLINFO_STARTTRANSFER_TIME,&firstByte);curl_easy_getinfo(handle,CURLINFO_TOTAL_TIME,&total);
 std::string phase=status?"http-response":connect<=0?"tcp-connect":std::strncmp(url,"https:",6)==0&&tls<=0?"tls-handshake":"http-wait";
 metrics="{\"phase\":\""+phase+"\",\"lookupMs\":"+std::to_string(lookup*1000)+",\"connectMs\":"+std::to_string(connect*1000)+",\"tlsMs\":"+std::to_string(tls*1000)+",\"firstByteMs\":"+std::to_string(firstByte*1000)+",\"totalMs\":"+std::to_string(total*1000)+"}";
 if(result!=CURLE_OK)errorText=curl_easy_strerror(result); // Do not return URLs, headers or library error buffers.
 body.swap(reply.bytes);curl_easy_cleanup(handle);curl_slist_free_all(forced);curl_slist_free_all(list);return result==CURLE_OK?int(status):-int(result)-1;
}
API int net_doh(const char* input){
 const std::string host=input?input:"";if(host.empty()||host.size()>253||host.find_first_not_of("abcdefghijklmnopqrstuvwxyz0123456789.-")!=std::string::npos)return -1;
 auto q=question(host);if(q.empty())return -1;
 const char* ips[]={"1.1.1.1","1.0.0.1","8.8.8.8","8.8.4.4","94.140.14.14","94.140.15.15"};
 const char* names[]={"cloudflare-dns.com","cloudflare-dns.com","dns.google","dns.google","dns.adguard-dns.com","dns.adguard-dns.com"};
 CURLM* multi=curl_multi_init();CURL* handles[6]={};curl_slist* forced[6]={};curl_slist* accept=curl_slist_append(nullptr,"Accept: application/dns-message");Reply replies[6];std::string urls[6],entries[6];
 for(int i=0;i<6;i++){handles[i]=curl_easy_init();secure(handles[i]);urls[i]=std::string("https://")+names[i]+"/dns-query?dns="+encode(q);entries[i]=std::string(names[i])+":443:"+ips[i]+":443";forced[i]=curl_slist_append(nullptr,entries[i].c_str());curl_easy_setopt(handles[i],CURLOPT_URL,urls[i].c_str());curl_easy_setopt(handles[i],CURLOPT_CONNECT_TO,forced[i]);curl_easy_setopt(handles[i],CURLOPT_HTTPHEADER,accept);curl_easy_setopt(handles[i],CURLOPT_TIMEOUT_MS,5000L);curl_easy_setopt(handles[i],CURLOPT_WRITEFUNCTION,collect);curl_easy_setopt(handles[i],CURLOPT_WRITEDATA,&replies[i]);curl_multi_add_handle(multi,handles[i]);}
 int running=0,winner=-1;std::vector<std::string> addresses;unsigned ttl=600;const auto start=std::chrono::steady_clock::now();
 do{
  curl_multi_perform(multi,&running);int remaining=0;CURLMsg* message;
  while((message=curl_multi_info_read(multi,&remaining))){if(message->msg!=CURLMSG_DONE||message->data.result!=CURLE_OK)continue;long status=0;curl_easy_getinfo(message->easy_handle,CURLINFO_RESPONSE_CODE,&status);if(status!=200)continue;for(int i=0;i<6;i++)if(handles[i]==message->easy_handle&&parse(replies[i],q,addresses,ttl)){winner=i;break;}if(winner>=0)break;}
  if(winner>=0||!running)break;
  int descriptors=0;curl_multi_wait(multi,nullptr,0,50,&descriptors);
 }while(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-start).count()<5000);
 for(int i=0;i<6;i++){curl_multi_remove_handle(multi,handles[i]);curl_easy_cleanup(handles[i]);curl_slist_free_all(forced[i]);}curl_multi_cleanup(multi);curl_slist_free_all(accept);
 report="{}";if(winner>=0){std::string list="[";for(size_t i=0;i<addresses.size();i++){if(i)list+=",";list+="\""+addresses[i]+"\"";}list+="]";report="{\"ip\":\""+addresses[0]+"\",\"ips\":"+list+",\"ttl\":"+std::to_string(ttl)+",\"resolver\":\""+ips[winner]+"\"}";}

 return winner>=0?1:0;
}
}
