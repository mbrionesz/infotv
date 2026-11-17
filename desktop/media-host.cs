// XuperWindows: isolated libVLC host. JSON-lines over inherited pipes only.
// Build with the .NET Framework compiler supplied on Windows; no HTTP controller.
using System;
using System.IO;
using System.Text;
using System.Globalization;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Web.Script.Serialization;
class XuperMediaHost {
 const string Lib="libvlc.dll";
 [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
 [DllImport("shcore.dll")] static extern int SetProcessDpiAwareness(int value);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool SetDllDirectory(string path);
 [DllImport("kernel32.dll")] static extern uint SetErrorMode(uint mode);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern IntPtr libvlc_new(int argc,[MarshalAs(UnmanagedType.LPArray,ArraySubType=UnmanagedType.LPStr)] string[] argv);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_release(IntPtr instance);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern IntPtr libvlc_get_version();
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern IntPtr libvlc_media_new_location(IntPtr instance,[MarshalAs(UnmanagedType.LPStr)] string url);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_add_option(IntPtr media,[MarshalAs(UnmanagedType.LPStr)] string option);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_release(IntPtr media);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern IntPtr libvlc_media_player_new_from_media(IntPtr media);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_player_release(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_player_set_hwnd(IntPtr player,IntPtr hwnd);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_media_player_play(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_player_stop(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_player_set_pause(IntPtr player,int pause);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_media_player_set_time(IntPtr player,long ms);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern long libvlc_media_player_get_time(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern long libvlc_media_player_get_length(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_media_player_get_state(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_video_get_size(IntPtr player,uint num,out uint width,out uint height);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern float libvlc_media_player_get_fps(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_video_set_mouse_input(IntPtr player,uint enabled);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_video_set_key_input(IntPtr player,uint enabled);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_audio_set_track(IntPtr player,int id);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_audio_get_track(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern IntPtr libvlc_audio_get_track_description(IntPtr player);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern void libvlc_track_description_list_release(IntPtr list);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_video_set_spu(IntPtr player,int id);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] static extern int libvlc_media_player_add_slave(IntPtr player,uint type,[MarshalAs(UnmanagedType.LPStr)] string url,[MarshalAs(UnmanagedType.I1)] bool select);
 [DllImport(Lib,CallingConvention=CallingConvention.Cdecl)] [return:MarshalAs(UnmanagedType.I1)] static extern bool libvlc_media_get_stats(IntPtr media,out MediaStats stats);
 [StructLayout(LayoutKind.Sequential)] struct MediaStats {public int read;public float inputBitrate;public int demuxRead;public float demuxBitrate;public int corrupt,discontinuity,decodedVideo,decodedAudio,displayed,lostPictures,playedAudio,lostAudio,sentPackets,sentBytes;public float sendBitrate;}
 [StructLayout(LayoutKind.Sequential)] struct Track {public int id;public IntPtr name,next;}
 static IntPtr instance=IntPtr.Zero,media=IntPtr.Zero,player=IntPtr.Zero;
 static readonly JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=65536};
 static string Text(Dictionary<string,object> r,string key,string fallback=""){object v;return r.TryGetValue(key,out v)&&v!=null?Convert.ToString(v,CultureInfo.InvariantCulture):fallback;}
 static double Number(Dictionary<string,object> r,string key,double fallback=0){double v;return double.TryParse(Text(r,key),NumberStyles.Float,CultureInfo.InvariantCulture,out v)?v:fallback;}
 static bool Flag(Dictionary<string,object> r,string key){return Text(r,key).Equals("true",StringComparison.OrdinalIgnoreCase);}
 static Dictionary<string,object> Obj(params object[] a){var r=new Dictionary<string,object>();for(int i=0;i<a.Length;i+=2)r[(string)a[i]]=a[i+1];return r;}
 static string Utf8(IntPtr p){if(p==IntPtr.Zero)return "";int n=0;while(n<4096&&Marshal.ReadByte(p,n)!=0)n++;var bytes=new byte[n];Marshal.Copy(p,bytes,0,n);return Encoding.UTF8.GetString(bytes);}
 static void Stop(){if(player!=IntPtr.Zero){libvlc_media_player_stop(player);libvlc_media_player_release(player);player=IntPtr.Zero;}if(media!=IntPtr.Zero){libvlc_media_release(media);media=IntPtr.Zero;}}
 static void Open(Dictionary<string,object> r){
  Stop();if(instance==IntPtr.Zero){var args=new List<string>{"--ignore-config","--no-media-library","--no-metadata-network-access","--no-sub-autodetect-file","--no-video-title-show","--network-caching=2000","--http-proxy=","--avcodec-threads=2","--audio-language="+Text(r,"language","es,spa")};string output=Text(r,"videoOutput");if(output=="wingdi")args.Add("--vout=wingdi");if(Flag(r,"software"))args.Add("--avcodec-hw=none");if(Flag(r,"silent"))args.Add("--aout=dummy");instance=libvlc_new(args.Count,args.ToArray());if(instance==IntPtr.Zero)throw new Exception("LIBVLC_INIT");}
  string url=Text(r,"url");Uri parsed;if(!Uri.TryCreate(url,UriKind.Absolute,out parsed)||parsed.Scheme!="http"||parsed.Host!="127.0.0.1")throw new Exception("INVALID_LOCAL_MEDIA");
  media=libvlc_media_new_location(instance,url);if(media==IntPtr.Zero)throw new Exception("MEDIA_INIT");double start=Number(r,"time");if(start>0)libvlc_media_add_option(media,":start-time="+start.ToString(CultureInfo.InvariantCulture));
  player=libvlc_media_player_new_from_media(media);if(player==IntPtr.Zero)throw new Exception("PLAYER_INIT");string hwnd=Text(r,"hwnd");if(hwnd!=""){ulong value=ulong.Parse(hwnd,CultureInfo.InvariantCulture);libvlc_media_player_set_hwnd(player,IntPtr.Size==8?new IntPtr(unchecked((long)value)):new IntPtr(unchecked((int)value)));}
  libvlc_video_set_key_input(player,0);libvlc_video_set_mouse_input(player,0);if(libvlc_media_player_play(player)!=0)throw new Exception("MEDIA_OPEN");
 }
 static Dictionary<string,object> Status(){
  if(player==IntPtr.Zero)return Obj("state","idle","time",0,"length",0,"stats",Obj("decodedvideo",0,"decodedaudio",0));
  int state=libvlc_media_player_get_state(player);string[] names={"idle","opening","buffering","playing","paused","stopped","ended","error"};uint w=0,h=0;libvlc_video_get_size(player,0,out w,out h);MediaStats stats=new MediaStats();if(media!=IntPtr.Zero)libvlc_media_get_stats(media,out stats);
  var tracks=new Dictionary<string,object>();IntPtr list=libvlc_audio_get_track_description(player),p=list;int selected=libvlc_audio_get_track(player),index=0;
  try{for(int i=0;p!=IntPtr.Zero&&i<64;i++){Track track=(Track)Marshal.PtrToStructure(p,typeof(Track));if(track.id>=0)tracks["Stream "+index++]=Obj("Type","Audio","ID",track.id,"Name",Utf8(track.name),"Selected",track.id==selected);p=track.next;}}finally{if(list!=IntPtr.Zero)libvlc_track_description_list_release(list);}
  if(w>0&&h>0)tracks["Stream video"]=Obj("Type","Video","ID",0,"Video_resolution",w+"x"+h);
  double length=Math.Max(0,libvlc_media_player_get_length(player)/1000.0),time=Math.Max(0,libvlc_media_player_get_time(player)/1000.0);float fps=libvlc_media_player_get_fps(player);
  return Obj("state",names[Math.Max(0,Math.Min(7,state))],"time",time,"length",length,"position",length>0?time/length:0,"fps",float.IsNaN(fps)||float.IsInfinity(fps)?0:fps,"stats",Obj("decodedvideo",stats.decodedVideo,"decodedaudio",stats.decodedAudio,"displayedpictures",stats.displayed),"information",Obj("category",tracks));
 }
 static object Command(Dictionary<string,object> r){string action=Text(r,"action");if(action=="open"){Open(r);return Status();}if(action=="status")return Status();if(player==IntPtr.Zero)throw new Exception("NO_MEDIA");if(action=="pause"){int expected=Flag(r,"paused")?4:3;libvlc_media_player_set_pause(player,expected==4?1:0);for(int i=0;i<100&&libvlc_media_player_get_state(player)!=expected;i++)System.Threading.Thread.Sleep(10);}else if(action=="seek")libvlc_media_player_set_time(player,(long)(Math.Max(0,Number(r,"time"))*1000));else if(action=="audio")libvlc_audio_set_track(player,(int)Number(r,"track"));else if(action=="subtitle-off")libvlc_video_set_spu(player,-1);else if(action=="subtitle"){string url=Text(r,"url");Uri parsed;if(!Uri.TryCreate(url,UriKind.Absolute,out parsed)||parsed.Scheme!="http"||parsed.Host!="127.0.0.1")throw new Exception("INVALID_SUBTITLE");if(libvlc_media_player_add_slave(player,0,url,true)!=0)throw new Exception("SUBTITLE_OPEN");}else throw new Exception("INVALID_COMMAND");return Status();}
 static void Main(){SetErrorMode(3);try{SetProcessDpiAwarenessContext(new IntPtr(-4));}catch(EntryPointNotFoundException){try{SetProcessDpiAwareness(2);}catch{}}string root=AppDomain.CurrentDomain.BaseDirectory;SetDllDirectory(root);Environment.SetEnvironmentVariable("VLC_PLUGIN_PATH",Path.Combine(root,"plugins"));
  var output=new StreamWriter(Console.OpenStandardOutput(),new UTF8Encoding(false)){AutoFlush=true};var input=new StreamReader(Console.OpenStandardInput(),new UTF8Encoding(false));
  output.WriteLine(json.Serialize(Obj("event","ready","protocol",1)));try{string line;while((line=input.ReadLine())!=null){if(line.Length>65536)break;Dictionary<string,object> request=null;try{request=json.Deserialize<Dictionary<string,object>>(line);object result=Command(request);output.WriteLine(json.Serialize(Obj("requestId",Number(request,"requestId"),"result",result)));}catch(Exception e){output.WriteLine(json.Serialize(Obj("requestId",request==null?0:Number(request,"requestId"),"error",e is DllNotFoundException?"LIBVLC_NOT_FOUND":e is BadImageFormatException?"LIBVLC_ARCHITECTURE":e.Message.Length<80?e.Message:"NATIVE_COMMAND_ERROR")));}}}finally{Stop();if(instance!=IntPtr.Zero)libvlc_release(instance);}
 }
}
