// QA only: exercise actual Windows mouse messages over the embedded decoder.
using System;
using System.Runtime.InteropServices;
using System.Threading;
class VodPointer {
 [DllImport("user32.dll")] static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] static extern void mouse_event(uint flags,uint dx,uint dy,uint data,UIntPtr extra);
 static int Main(string[] args){
  if(args.Length<2)return 2;
  if(!SetCursorPos(int.Parse(args[0]),int.Parse(args[1])))return 3;
  Thread.Sleep(100);
  if(args.Length>2&&args[2]=="click"){mouse_event(0x0002,0,0,0,UIntPtr.Zero);Thread.Sleep(50);mouse_event(0x0004,0,0,0,UIntPtr.Zero);}
  return 0;
 }
}
