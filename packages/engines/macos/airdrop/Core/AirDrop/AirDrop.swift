import AppKit

/// Entry point for the AirDrop engine.
///
/// A plain CLI still needs an `NSApplication` for the AirDrop picker to appear;
/// it runs as an `.accessory` so no Dock icon or menu bar shows. The reporter
/// is held here for the process lifetime because the sharing service keeps only
/// a weak delegate reference.
@main
enum AirDrop {
    static func main() {
        let application = NSApplication.shared
        application.setActivationPolicy(.accessory)

        let reporter = AirDropReporter()
        let filePaths = Array(CommandLine.arguments.dropFirst())

        DispatchQueue.main.async {
            NSApp.activate(ignoringOtherApps: true)
            AirDropShareService.share(filePaths: filePaths, reporter: reporter)
        }

        application.run()
    }
}
