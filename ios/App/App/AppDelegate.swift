import UIKit
import Capacitor

@main
class AppDelegate: UIResponder, UIApplicationDelegate {}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        self.scene(scene, openURLContexts: connectionOptions.urlContexts)
        for activity in connectionOptions.userActivities {
            self.scene(scene, continue: activity)
        }
    }

    func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
        for context in contexts {
            var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
            options[.sourceApplication] = context.options.sourceApplication
            options[.annotation] = context.options.annotation
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: options)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}

// Capacitor's default router serves the home page for every extensionless URL.
// This bundle is a Next.js multi-page export, so resolve its directory indexes instead.
class MealPlannerBridgeViewController: CAPBridgeViewController {
    override func router() -> Router {
        return MealPlannerAssetRouter()
    }
}

private struct MealPlannerAssetRouter: Router {
    var basePath = ""

    func route(for path: String) -> String {
        let root = URL(fileURLWithPath: basePath, isDirectory: true).standardizedFileURL
        let requested = root.appendingPathComponent(path).standardizedFileURL
        let fallback = root.appendingPathComponent("404.html").path
        guard requested.path == root.path || requested.path.hasPrefix(root.path + "/") else {
            return fallback
        }
        if !requested.pathExtension.isEmpty { return requested.path }
        let index = requested.appendingPathComponent("index.html").path
        return FileManager.default.fileExists(atPath: index) ? index : fallback
    }
}
