import SwiftUI
import WebKit

struct GameScreen: View {
    var body: some View {
        BundledGameView()
            .ignoresSafeArea()
            .background(Color(red: 12 / 255, green: 8 / 255, blue: 16 / 255))
            .statusBarHidden()
    }
}

private struct BundledGameView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 12 / 255, green: 8 / 255, blue: 16 / 255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        if let gameURL = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(gameURL, allowingReadAccessTo: gameURL.deletingLastPathComponent())
        }

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
