package com.matiasb.xuperandroid

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp

/** Shared Zinc palette from app/css/shadcn-tv.css, expressed with native Android components. */
internal object XuperStyle {
 val background=Color(0xFF09090B)
 val foreground=Color(0xFFFAFAFA)
 val card=Color(0xFF111113)
 val secondary=Color(0xFF27272A)
 val muted=Color(0xFFA1A1AA)
 val ring=Color(0xFFD4D4D8)
 val primaryText=Color(0xFF18181B)
 val control=RoundedCornerShape(12.dp)
}

@Composable internal fun XuperTheme(content: @Composable ()->Unit) {
 MaterialTheme(
  colorScheme=darkColorScheme(
   primary=XuperStyle.foreground,onPrimary=XuperStyle.primaryText,
   primaryContainer=XuperStyle.secondary,onPrimaryContainer=XuperStyle.foreground,
   secondary=XuperStyle.ring,onSecondary=XuperStyle.primaryText,
   secondaryContainer=XuperStyle.secondary,onSecondaryContainer=XuperStyle.foreground,
   background=XuperStyle.background,onBackground=XuperStyle.foreground,
   surface=XuperStyle.card,onSurface=XuperStyle.foreground,
   surfaceVariant=XuperStyle.secondary,onSurfaceVariant=XuperStyle.muted,
   surfaceDim=XuperStyle.background,surfaceBright=XuperStyle.secondary,
   surfaceContainerLowest=XuperStyle.background,surfaceContainerLow=XuperStyle.card,
   surfaceContainer=Color(0xFF141416),surfaceContainerHigh=Color(0xFF1B1B1E),surfaceContainerHighest=XuperStyle.secondary,
   outline=XuperStyle.muted,outlineVariant=XuperStyle.secondary,
   error=Color(0xFFFFB4AB),onError=Color(0xFF690005)
  ),
  shapes=Shapes(small=RoundedCornerShape(8.dp),medium=XuperStyle.control,large=RoundedCornerShape(16.dp),extraLarge=RoundedCornerShape(20.dp))
 ) {
  // MaterialTheme alone does not provide LocalContentColor. Every screen must inherit it here.
  Surface(Modifier.fillMaxSize(),color=XuperStyle.background,contentColor=XuperStyle.foreground,content=content)
 }
}

@Composable internal fun XuperOutlinedButton(
 onClick: ()->Unit,modifier: Modifier=Modifier,enabled: Boolean=true,
 shape: Shape=XuperStyle.control,
 colors: ButtonColors=ButtonDefaults.outlinedButtonColors(containerColor=XuperStyle.secondary,contentColor=XuperStyle.foreground),
 border: BorderStroke?=BorderStroke(1.dp,XuperStyle.secondary),
 contentPadding: PaddingValues=PaddingValues(horizontal=16.dp,vertical=10.dp),
 content: @Composable RowScope.()->Unit
) {
 OutlinedButton(onClick,modifier.defaultMinSize(minHeight=48.dp),enabled,shape,colors,border=border,contentPadding=contentPadding,content=content)
}
@Composable internal fun XuperButton(
 onClick: ()->Unit,modifier: Modifier=Modifier,enabled: Boolean=true,
 content: @Composable RowScope.()->Unit
) {
 Button(onClick,modifier.defaultMinSize(minHeight=48.dp),enabled,shape=XuperStyle.control,content=content)
}
