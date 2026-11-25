package com.matiasb.xuperandroid.data
import org.json.JSONObject
import org.junit.Test
import org.junit.Assert.*
class VodMetadataTest {
 @Test fun fullHdAndUhdAreNotTreatedAsUnknown(){assertEquals(1080,vodHeight(JSONObject().put("quality","FHD")));assertEquals(2160,vodHeight(JSONObject().put("groupQuality","UHD")));assertEquals(720,vodHeight(JSONObject().put("quality","HD")))}
 @Test fun fullDimensionsUseVerticalSize(){assertEquals(1080,vodHeight(JSONObject().put("resolution","1920x1080")));assertEquals(534,vodHeight(JSONObject().put("pixelHeight",534)))}
 @Test fun rationalFpsAndAliases(){assertEquals(23.976f,vodFps(JSONObject().put("videoFps","24000/1001")),.001f);assertEquals(59.94f,vodFps(JSONObject().put("fps","59,94")),.001f);assertEquals(0f,vodFps(JSONObject().put("fps","1/0")),0f)}
 @Test fun unknownMetadataStaysUnknown(){assertEquals(0,vodHeight(JSONObject()));assertEquals(0f,vodFps(JSONObject()),0f);assertEquals("es-419",vodAudio(JSONObject().put("audioLanguage","es-419")))}
}
