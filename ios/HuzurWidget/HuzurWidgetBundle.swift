//
//  HuzurWidgetBundle.swift
//  HuzurWidget
//
//  Created by Aziz Ekinci on 17.05.2026.
//

import WidgetKit
import SwiftUI

@main
struct HuzurWidgetBundle: WidgetBundle {
    var body: some Widget {
        HuzurWidget()
        HuzurWidgetControl()
        HuzurWidgetLiveActivity()
    }
}
