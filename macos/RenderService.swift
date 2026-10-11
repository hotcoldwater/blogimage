import Foundation

struct RenderCommandResult {
    let outputURLs: [URL]
    let log: String

    var outputURL: URL { outputURLs[0] }
}

enum RenderServiceError: LocalizedError {
    case message(String)

    var errorDescription: String? {
        switch self {
        case .message(let message):
            return message
        }
    }
}

enum RenderService {
    static func projectRoot(for bundle: Bundle = .main) throws -> URL {
        let bundleURL = bundle.bundleURL.standardizedFileURL
        let candidate = bundleURL.pathExtension == "app"
            ? bundleURL.deletingLastPathComponent()
            : URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
        guard FileManager.default.fileExists(atPath: candidate.appendingPathComponent("package.json").path) else {
            throw RenderServiceError.message(
                "BlogImage.app을 blogimage 프로젝트 루트에 두어야 합니다. package.json을 찾을 수 없습니다: \(candidate.path)"
            )
        }
        return candidate
    }

    static func renderSync(json: String, projectRoot: URL, outputRoot: URL? = nil) throws -> RenderCommandResult {
        guard !json.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw RenderServiceError.message("JSON 입력이 비어 있습니다.")
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/zsh")
        var command = "exec npm run render:single -- --stdin"
        if let outputRoot {
            command += " --output-dir \(shellQuote(outputRoot.path))"
        }
        process.arguments = ["-lc", command]
        process.currentDirectoryURL = projectRoot

        let inputPipe = Pipe()
        let outputPipe = Pipe()
        process.standardInput = inputPipe
        process.standardOutput = outputPipe
        process.standardError = outputPipe

        do {
            try process.run()
        } catch {
            throw RenderServiceError.message("렌더러를 실행하지 못했습니다: \(error.localizedDescription)")
        }

        if let inputData = json.data(using: .utf8) {
            inputPipe.fileHandleForWriting.write(inputData)
        }
        inputPipe.fileHandleForWriting.closeFile()

        let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        let log = String(data: outputData, encoding: .utf8) ?? ""

        guard process.terminationStatus == 0 else {
            throw RenderServiceError.message(userFacingLog(log))
        }

        let createdLines = log.split(separator: "\n", omittingEmptySubsequences: false)
            .map(String.init)
            .filter { $0.hasPrefix("Created: ") }
        guard !createdLines.isEmpty else {
            throw RenderServiceError.message("이미지는 생성됐지만 결과 경로를 확인하지 못했습니다.\n\(log)")
        }

        let outputURLs = createdLines.map {
            URL(fileURLWithPath: String($0.dropFirst("Created: ".count)), relativeTo: projectRoot).standardizedFileURL
        }
        if let missing = outputURLs.first(where: { !FileManager.default.fileExists(atPath: $0.path) }) {
            throw RenderServiceError.message("생성 결과 파일을 찾을 수 없습니다: \(missing.path)")
        }
        return RenderCommandResult(outputURLs: outputURLs, log: log)
    }

    private static func shellQuote(_ value: String) -> String {
        return "'" + value.replacingOccurrences(of: "'", with: "'\\''") + "'"
    }

    private static func userFacingLog(_ log: String) -> String {
        let markers = ["입력 오류:", "렌더링 오류:", "Rendering failed:", "Single rendering failed:"]
        for marker in markers {
            if let range = log.range(of: marker) {
                return String(log[range.lowerBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        let trimmed = log.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "알 수 없는 렌더링 오류가 발생했습니다." : trimmed
    }
}
