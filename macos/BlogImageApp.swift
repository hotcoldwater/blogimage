import AppKit
import SwiftUI

private enum StatusKind {
    case neutral
    case success
    case error

    var color: Color {
        switch self {
        case .neutral: return .secondary
        case .success: return .green
        case .error: return .red
        }
    }
}

struct ContentView: View {
    @State private var jsonText = ""
    @State private var isRendering = false
    @State private var statusText = "챗봇이 만든 JSON을 붙여넣고 생성 버튼을 누르세요."
    @State private var statusKind = StatusKind.neutral
    @State private var outputURLs: [URL] = []
    @State private var selectedOutputIndex = 0
    @State private var previewImage: NSImage?

    private var outputURL: URL? {
        outputURLs.indices.contains(selectedOutputIndex) ? outputURLs[selectedOutputIndex] : nil
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            HStack(spacing: 24) {
                inputPanel
                previewPanel
            }
            .padding(24)
            Divider()
            statusPanel
        }
        .frame(minWidth: 980, minHeight: 700)
        .background(Color(nsColor: .windowBackgroundColor))
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("BlogImage")
                    .font(.system(size: 28, weight: .bold))
                Text("블로그 이미지 JSON 단일·시리즈 생성기")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            Spacer()
            if isRendering {
                ProgressView()
                    .controlSize(.small)
                Text("생성 중…")
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 18)
    }

    private var inputPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("JSON 입력")
                .font(.headline)
            TextEditor(text: $jsonText)
                .font(.system(.body, design: .monospaced))
                .padding(8)
                .scrollContentBackground(.hidden)
                .background(Color(nsColor: .textBackgroundColor))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(nsColor: .separatorColor), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 8))

            HStack {
                Button("클립보드 붙여넣기") {
                    pasteClipboard()
                }
                Button("입력 지우기") {
                    jsonText = ""
                    statusText = "입력 내용을 지웠습니다."
                    statusKind = .neutral
                }
                Spacer()
                Button("생성") {
                    generate()
                }
                .keyboardShortcut(.return, modifiers: [.command])
                .buttonStyle(.borderedProminent)
                .disabled(isRendering || jsonText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var previewPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("미리보기")
                    .font(.headline)
                Spacer()
                if let outputURL {
                    Button("Finder에서 보기") {
                        NSWorkspace.shared.activateFileViewerSelecting([outputURL])
                    }
                }
            }

            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(nsColor: .controlBackgroundColor))
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color(nsColor: .separatorColor), lineWidth: 1)
                if let previewImage {
                    Image(nsImage: previewImage)
                        .resizable()
                        .scaledToFit()
                        .padding(10)
                } else {
                    VStack(spacing: 10) {
                        Image(systemName: "photo")
                            .font(.system(size: 42))
                        Text("생성된 이미지가 여기에 표시됩니다.")
                    }
                    .foregroundColor(.secondary)
                }
            }
            .aspectRatio(1, contentMode: .fit)

            if outputURLs.count > 1 {
                HStack {
                    Button {
                        selectOutput(selectedOutputIndex - 1)
                    } label: {
                        Label("이전", systemImage: "chevron.left")
                    }
                    .disabled(selectedOutputIndex == 0)
                    Spacer()
                    Text("\(selectedOutputIndex + 1) / \(outputURLs.count)")
                        .font(.system(.body, design: .monospaced))
                    Spacer()
                    Button {
                        selectOutput(selectedOutputIndex + 1)
                    } label: {
                        Label("다음", systemImage: "chevron.right")
                    }
                    .disabled(selectedOutputIndex == outputURLs.count - 1)
                }
            }

            if let outputURL {
                Text(outputURL.path)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundColor(.secondary)
                    .textSelection(.enabled)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var statusPanel: some View {
        ScrollView {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: statusKind == .error ? "exclamationmark.triangle.fill" : "info.circle.fill")
                    .foregroundColor(statusKind.color)
                Text(statusText)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(statusKind.color)
                    .textSelection(.enabled)
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
        }
        .frame(minHeight: 74, maxHeight: 130)
    }

    private func pasteClipboard() {
        guard let value = NSPasteboard.general.string(forType: .string), !value.isEmpty else {
            statusText = "클립보드에 텍스트가 없습니다."
            statusKind = .error
            return
        }
        jsonText = value
        statusText = "클립보드 내용을 입력창에 붙여넣었습니다."
        statusKind = .neutral
    }

    private func generate() {
        let input = jsonText
        isRendering = true
        statusText = "JSON을 검증하고 이미지를 생성하고 있습니다."
        statusKind = .neutral
        outputURLs = []
        selectedOutputIndex = 0
        previewImage = nil

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let root = try RenderService.projectRoot()
                let result = try RenderService.renderSync(json: input, projectRoot: root)
                let image = NSImage(contentsOf: result.outputURL)
                DispatchQueue.main.async {
                    outputURLs = result.outputURLs
                    selectedOutputIndex = 0
                    previewImage = image
                    statusText = result.outputURLs.count == 1
                        ? "생성 완료: \(result.outputURL.path)"
                        : "시리즈 \(result.outputURLs.count)장 생성 완료: \(result.outputURL.deletingLastPathComponent().path)"
                    statusKind = .success
                    isRendering = false
                }
            } catch {
                DispatchQueue.main.async {
                    statusText = error.localizedDescription
                    statusKind = .error
                    isRendering = false
                }
            }
        }
    }

    private func selectOutput(_ index: Int) {
        guard outputURLs.indices.contains(index) else { return }
        selectedOutputIndex = index
        previewImage = NSImage(contentsOf: outputURLs[index])
    }
}

@main
struct BlogImageApp: App {
    var body: some Scene {
        WindowGroup("BlogImage") {
            ContentView()
        }
        .windowStyle(.titleBar)
        .commands {
            CommandGroup(replacing: .newItem) { }
        }
    }
}
