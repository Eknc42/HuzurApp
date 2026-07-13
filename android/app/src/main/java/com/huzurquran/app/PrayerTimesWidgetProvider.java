package com.huzurquran.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class PrayerTimesWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prayer_times);

        SharedPreferences prefs = context.getSharedPreferences("group.com.huzurquran.app", Context.MODE_PRIVATE);
        String widgetDataStr = prefs.getString("prayerTimes", null);

        if (widgetDataStr != null) {
            try {
                JSONObject widgetData = new JSONObject(widgetDataStr);
                String location = widgetData.optString("location", "Konum Bulunamadı");

                String[] prayerNames = {"İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"};
                String[] prayerKeys = {"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"};
                String[] times = new String[6];
                
                for (int i = 0; i < 6; i++) {
                    times[i] = widgetData.optString(prayerKeys[i], "00:00");
                }

                long now = System.currentTimeMillis();
                long nextPrayerMillis = 0;
                String nextPrayerName = "İmsak";
                String targetTimeStr = times[0];

                Calendar calendar = Calendar.getInstance();
                boolean foundNext = false;

                for (int i = 0; i < 6; i++) {
                    String[] parts = times[i].split(":");
                    calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
                    calendar.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
                    calendar.set(Calendar.SECOND, 0);
                    
                    if (calendar.getTimeInMillis() > now) {
                        nextPrayerMillis = calendar.getTimeInMillis();
                        nextPrayerName = prayerNames[i];
                        targetTimeStr = times[i];
                        foundNext = true;
                        break;
                    }
                }

                if (!foundNext) {
                    // Next is Fajr tomorrow
                    String[] parts = times[0].split(":");
                    calendar.add(Calendar.DAY_OF_YEAR, 1);
                    calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
                    calendar.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
                    calendar.set(Calendar.SECOND, 0);
                    nextPrayerMillis = calendar.getTimeInMillis();
                    nextPrayerName = "İmsak";
                    targetTimeStr = times[0];
                }

                views.setTextViewText(R.id.widget_location, location);
                views.setTextViewText(R.id.widget_next_prayer_title, nextPrayerName + "'a Kalan Süre");
                views.setTextViewText(R.id.widget_target_time, "Vakit: " + targetTimeStr);

                // Set up the Chronometer
                long timeDiff = nextPrayerMillis - now;
                long baseTime = SystemClock.elapsedRealtime() + timeDiff;
                
                views.setChronometer(R.id.widget_chronometer, baseTime, "%s", true);
                // API 24+ Countdown feature
                try {
                    views.setBoolean(R.id.widget_chronometer, "setCountDown", true);
                } catch (Exception e) {
                    // Ignore on older devices
                }
                
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Tap widget to open app
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
