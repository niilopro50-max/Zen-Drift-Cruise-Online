import SwiftUI
import WebKit

private let onlineGameURL = URL(string: "https://zen-drift-cruise-online.onrender.com/play")!

struct GameScreen: View {
    var body: some View {
        BundledGameView()
            .ignoresSafeArea()
            .background(Color(red: 12 / 255, green: 8 / 255, blue: 16 / 255))
            .statusBarHidden()
    }
}

private struct BundledGameView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

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
        webView.navigationDelegate = context.coordinator

        if let gameURL = Bundle.main.url(forResource: "index", withExtension: "html") {
            context.coordinator.localGameURL = gameURL
        }
        webView.load(URLRequest(url: onlineGameURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        var localGameURL: URL?
        private var openedLocalCopy = false

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            openLocalCopy(in: webView)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            openLocalCopy(in: webView)
        }

        private func openLocalCopy(in webView: WKWebView) {
            guard !openedLocalCopy, let gameURL = localGameURL else { return }
            openedLocalCopy = true
            webView.loadFileURL(gameURL, allowingReadAccessTo: gameURL.deletingLastPathComponent())
        }
    }
}
