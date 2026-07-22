import Foundation

enum ExitCode {
    static let transferFailed: Int32 = 1
    static let internalError: Int32 = 2
}

/// Writes the NDJSON engine protocol to stdout, one event per line.
///
/// Diagnostics never go to stdout; the CLI parses every line it reads there.
/// A payload that cannot be serialised means the protocol is broken, so the
/// engine exits rather than leaving the CLI waiting on an event that will
/// never arrive.
enum EventEmitter {
    static func emit(_ fields: [String: Any]) {
        guard let payload = try? JSONSerialization.data(withJSONObject: fields),
              let line = String(data: payload, encoding: .utf8)
        else {
            FileHandle.standardError.write(Data("airdrop: failed to serialise event\n".utf8))
            exit(ExitCode.internalError)
        }

        FileHandle.standardOutput.write(Data((line + "\n").utf8))
    }

    static func emitFailure(reason: String, code: Int = 0) {
        emit(["event": "failed", "reason": reason, "code": code])
    }
}
