package com.huzurquran.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

public class DailyVerseWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily_verse);

        // Fetch data from SharedPreferences (react-native-shared-group-preferences)
        // By default, the library uses the group name as the preferences file name.
        SharedPreferences prefs = context.getSharedPreferences("group.com.huzurquran.app", Context.MODE_PRIVATE);
        String widgetDataStr = prefs.getString("dailyVerse", null);

        if (widgetDataStr != null) {
            try {
                JSONObject widgetData = new JSONObject(widgetDataStr);
                String arabic = widgetData.optString("arabicText", "");
                String tr = widgetData.optString("translationTr", "");
                String surah = widgetData.optString("surahRef", "");

                views.setTextViewText(R.id.widget_arabic, arabic);
                views.setTextViewText(R.id.widget_translation, tr);
                views.setTextViewText(R.id.widget_surah, surah);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Tap widget to open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_title, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
