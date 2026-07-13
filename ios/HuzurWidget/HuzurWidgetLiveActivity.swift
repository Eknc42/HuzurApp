//
//  HuzurWidgetLiveActivity.swift
//  HuzurWidget
//
//  Created by Aziz Ekinci on 17.05.2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct HuzurWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct HuzurWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HuzurWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension HuzurWidgetAttributes {
    fileprivate static var preview: HuzurWidgetAttributes {
        HuzurWidgetAttributes(name: "World")
    }
}

extension HuzurWidgetAttributes.ContentState {
    fileprivate static var smiley: HuzurWidgetAttributes.ContentState {
        HuzurWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: HuzurWidgetAttributes.ContentState {
         HuzurWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: HuzurWidgetAttributes.preview) {
   HuzurWidgetLiveActivity()
} contentStates: {
    HuzurWidgetAttributes.ContentState.smiley
    HuzurWidgetAttributes.ContentState.starEyes
}
