import SwiftUI

@main
struct ZenDriftCruiseApp: App {
    var body: some Scene {
        WindowGroup {
            GameScreen()
                .preferredColorScheme(.dark)
        }
    }
}
