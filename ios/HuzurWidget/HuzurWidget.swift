import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", translation: "Biliniz ki, kalpler ancak Allah'ı anmakla huzur bulur.", surah: "Ra'd Suresi · 13:28")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = getEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getEntry()
        // Refresh every 3 hours
        let nextUpdateDate = Calendar.current.date(byAdding: .hour, value: 3, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
    
    private func getEntry() -> SimpleEntry {
        // App Group Identifier
        let userDefaults = UserDefaults(suiteName: "group.com.huzurquran.app")
        let defaultArabic = "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
        let defaultTr = "Biliniz ki, kalpler ancak Allah'ı anmakla huzur bulur."
        let defaultSurah = "Ra'd Suresi · 13:28"
        
        if let dataString = userDefaults?.string(forKey: "dailyVerse"),
           let data = dataString.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            
            let arabic = json["arabicText"] as? String ?? defaultArabic
            let translation = json["translationTr"] as? String ?? defaultTr
            let surah = json["surahRef"] as? String ?? defaultSurah
            
            return SimpleEntry(date: Date(), arabic: arabic, translation: translation, surah: surah)
        }
        
        return SimpleEntry(date: Date(), arabic: defaultArabic, translation: defaultTr, surah: defaultSurah)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let arabic: String
    let translation: String
    let surah: String
}

struct HuzurWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            Color(red: 10/255, green: 10/255, blue: 10/255).edgesIgnoringSafeArea(.all)
            
            if family == .accessoryRectangular {
                // Lock Screen Widget
                VStack(alignment: .leading, spacing: 4) {
                    Text("📻 Günün Ayeti")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
                    Text(entry.translation)
                        .font(.system(size: 12))
                        .lineLimit(2)
                        .foregroundColor(.white)
                }
            } else {
                // Home Screen Widget (Medium or Large)
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Günün Ayeti")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
                            .textCase(.uppercase)
                        Spacer()
                    }
                    
                    Text(entry.arabic)
                        .font(.system(size: family == .systemLarge ? 24 : 18))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                    
                    Text(entry.translation)
                        .font(.system(size: family == .systemLarge ? 14 : 12))
                        .foregroundColor(Color(white: 0.8))
                        .lineLimit(family == .systemLarge ? 5 : 3)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Spacer()
                    
                    Text(entry.surah)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(Color(white: 0.5))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .padding()
            }
        }
    }
}

@main
struct HuzurWidget: Widget {
    let kind: String = "HuzurWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            HuzurWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Günün Ayeti")
        .description("Her gün ruhunuza dokunan yeni bir ayet.")
        .supportedFamilies([.systemMedium, .systemLarge, .accessoryRectangular])
    }
}
