import AppKit

private let userCancelledCode = -128

/// Bridges the NSSharingService lifecycle onto the event protocol.
///
/// The delegate is held weakly by NSSharingService, so the caller must keep a
/// strong reference for the callbacks to ever fire.
final class AirDropReporter: NSObject, NSSharingServiceDelegate {
    func sharingService(_ service: NSSharingService, willShareItems items: [Any]) {
        let sharedPaths = items.compactMap { ($0 as? URL)?.path }
        EventEmitter.emit(["event": "started", "files": sharedPaths])
    }

    func sharingService(_ service: NSSharingService, didShareItems items: [Any]) {
        EventEmitter.emit(["event": "complete"])
        exit(EXIT_SUCCESS)
    }

    func sharingService(
        _ service: NSSharingService,
        didFailToShareItems items: [Any],
        error: Error,
    ) {
        let failure = error as NSError
        let reason = failure.code == userCancelledCode ? "cancelled" : "failed"
        EventEmitter.emitFailure(reason: reason, code: failure.code)
        exit(ExitCode.transferFailed)
    }
}

/// Starts an AirDrop share for the given paths, reporting progress through the
/// delegate. Exits with a failure event when there is nothing to send or when
/// AirDrop cannot run for these items.
enum AirDropShareService {
    static func share(filePaths: [String], reporter: AirDropReporter) {
        let requestedURLs = filePaths.map { URL(fileURLWithPath: $0) }
        if requestedURLs.isEmpty {
            EventEmitter.emitFailure(reason: "no-files")
            exit(ExitCode.transferFailed)
        }

        let airDropService = NSSharingService(named: .sendViaAirDrop)
        guard let airDropService,
              airDropService.canPerform(withItems: requestedURLs)
        else {
            EventEmitter.emitFailure(reason: "unavailable")
            exit(ExitCode.transferFailed)
        }

        airDropService.delegate = reporter
        airDropService.perform(withItems: requestedURLs)
    }
}
