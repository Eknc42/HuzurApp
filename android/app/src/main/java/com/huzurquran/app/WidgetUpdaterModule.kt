package com.huzurquran.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetUpdaterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetUpdater"
    }

    @ReactMethod
    fun updateWidget() {
        val intent = Intent(reactContext, DailyVerseWidgetProvider::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        val ids = AppWidgetManager.getInstance(reactContext).getAppWidgetIds(ComponentName(reactContext, DailyVerseWidgetProvider::class.java))
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        reactContext.sendBroadcast(intent)
    }

    @ReactMethod
    fun updatePrayerWidget() {
        val intent = Intent(reactContext, PrayerTimesWidgetProvider::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        val ids = AppWidgetManager.getInstance(reactContext).getAppWidgetIds(ComponentName(reactContext, PrayerTimesWidgetProvider::class.java))
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        reactContext.sendBroadcast(intent)
    }
}
