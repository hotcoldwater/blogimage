import Foundation

@main
struct BridgeSmokeTest {
    static func main() {
        do {
            guard CommandLine.arguments.count == 4 else {
                throw RenderServiceError.message("Usage: bridge-smoke-test <project-root> <json-file> <output-root>")
            }
            let projectRoot = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
            let json = try String(contentsOfFile: CommandLine.arguments[2], encoding: .utf8)
            let outputRoot = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
            let result = try RenderService.renderSync(json: json, projectRoot: projectRoot, outputRoot: outputRoot)
            print("Bridge created: \(result.outputURL.path)")
        } catch {
            FileHandle.standardError.write(Data("\(error.localizedDescription)\n".utf8))
            exit(1)
        }
    }
}
