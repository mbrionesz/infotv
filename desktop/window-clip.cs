// The decoder is a cross-process child HWND. Apply its owner's region in actual
// Win32 client pixels, rather than Chromium's shaped-window compositor mask.
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.InteropServices;
static class NativeWindowClip {
 [StructLayout(LayoutKind.Sequential)] struct Rect {public int left,top,right,bottom;}
 [DllImport("user32.dll")] static extern bool GetClientRect(IntPtr hwnd,out Rect rect);
 [DllImport("user32.dll")] static extern int SetWindowRgn(IntPtr hwnd,IntPtr region,bool redraw);
 [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr hwnd,uint command);
 [DllImport("user32.dll")] static extern bool RedrawWindow(IntPtr hwnd,IntPtr rect,IntPtr region,uint flags);
 [DllImport("gdi32.dll")] static extern IntPtr CreateRectRgn(int left,int top,int right,int bottom);
 [DllImport("gdi32.dll")] static extern int CombineRgn(IntPtr target,IntPtr first,IntPtr second,int mode);
 [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr value);
 static double Number(Dictionary<string,object> value,string key){object result;return value.TryGetValue(key,out result)?Convert.ToDouble(result,CultureInfo.InvariantCulture):0;}
 public static object Apply(Dictionary<string,object> request){
  var hwnd=new IntPtr(unchecked((long)ulong.Parse(Convert.ToString(request["hwnd"]),CultureInfo.InvariantCulture)));
  Rect client;if(hwnd==IntPtr.Zero||!GetClientRect(hwnd,out client))throw new Exception("WINDOW_CLIP_HANDLE");
  double width=Number(request,"width"),height=Number(request,"height");var regions=request["regions"] as object[];
  if(width<1||height<1||width>32768||height>32768||regions==null||regions.Length<1||regions.Length>40)throw new Exception("WINDOW_CLIP_BOUNDS");
  double sx=(client.right-client.left)/width,sy=(client.bottom-client.top)/height;
  if(sx<=0||sy<=0)throw new Exception("WINDOW_CLIP_SIZE");
  IntPtr combined=CreateRectRgn(0,0,0,0);if(combined==IntPtr.Zero)throw new Exception("WINDOW_CLIP_REGION");
  try{
   foreach(var entry in regions){var r=entry as Dictionary<string,object>;if(r==null)throw new Exception("WINDOW_CLIP_RECT");double x=Number(r,"x"),y=Number(r,"y"),w=Number(r,"width"),h=Number(r,"height");if(x<0||y<0||w<0||h<0||x+w>width+1||y+h>height+1)throw new Exception("WINDOW_CLIP_RECT");
    IntPtr part=CreateRectRgn((int)Math.Floor(x*sx),(int)Math.Floor(y*sy),(int)Math.Ceiling((x+w)*sx),(int)Math.Ceiling((y+h)*sy));if(part==IntPtr.Zero)throw new Exception("WINDOW_CLIP_REGION");try{if(CombineRgn(combined,combined,part,2)==0)throw new Exception("WINDOW_CLIP_COMBINE");}finally{DeleteObject(part);}
   }
   if(SetWindowRgn(hwnd,combined,true)==0)throw new Exception("WINDOW_CLIP_APPLY");combined=IntPtr.Zero; // Ownership transfers to Windows.
   IntPtr owner=GetWindow(hwnd,4);if(owner!=IntPtr.Zero)RedrawWindow(owner,IntPtr.Zero,IntPtr.Zero,0x0001|0x0080|0x0100);
   return new Dictionary<string,object>{{"clipped",true},{"width",client.right-client.left},{"height",client.bottom-client.top},{"scaleX",sx},{"scaleY",sy},{"regions",regions.Length}};
  }finally{if(combined!=IntPtr.Zero)DeleteObject(combined);}
 }
}
