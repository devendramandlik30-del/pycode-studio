
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { loadPyodide, version as pyodideVersion } from "pyodide";

let pyodidePromise;

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });
  }

  return pyodidePromise;
}

const starterCode = `name = input("Enter your name: ")
print("Hello,", name)
print("10 + 20 =", 10 + 20)`;

const examples = {
  Greeting: starterCode,
  Fibonacci: `n = 10
a, b = 0, 1
for _ in range(n):
    print(a)
    a, b = b, a + b`,
  Factorial: `n = 5
result = 1
for i in range(1, n + 1):
    result *= i
print("Factorial:", result)`,
  Lists: `numbers = [8, 2, 5, 1, 9]
print("Original:", numbers)
print("Sorted:", sorted(numbers))`,
};

export default function App() {
  const [code, setCode] = useState(starterCode);
  const [userInput, setUserInput] = useState("Devendra");
  const [output, setOutput] = useState("Your program output will appear here.");
  const [running, setRunning] = useState(false);
  const [example, setExample] = useState("Greeting");

  async function runCode() {
    if (running) return;
    setRunning(true);
    setOutput("Loading Python...");

    try {
      const py = await getPyodide();

      py.globals.set("user_input_text", userInput);
      await py.runPythonAsync(`
import builtins
_input_lines = iter(user_input_text.splitlines())
builtins.input = lambda prompt="": next(_input_lines, "")
      `);

      let result = "";
      py.setStdout({ batched: (text) => { result += text + "\n"; } });
      py.setStderr({ batched: (text) => { result += text + "\n"; } });

      await py.runPythonAsync(code);
      setOutput(result || "Program finished with no output.");
    } catch (error) {
      setOutput("Error: " + error.message);
    } finally {
      setRunning(false);
    }
  }

  function downloadCode() {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "main.py";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetCode() {
    setCode(starterCode);
    setUserInput("Devendra");
    setOutput("Your program output will appear here.");
    setExample("Greeting");
  }

  function loadExample(name) {
    setExample(name);
    setCode(examples[name]);
    setOutput("Example loaded. Click Run Code.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <h1 className="text-xl font-bold text-white">PyCode Studio</h1>
          <p className="text-sm text-slate-400">Free browser-based Python compiler</p>
        </div>
        <span className="rounded-full border border-emerald-700 px-3 py-1 text-xs text-emerald-400">
          Python · Pyodide
        </span>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={runCode}
            disabled={running}
            className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {running ? "Running..." : "▶ Run Code"}
          </button>
          <button onClick={resetCode} className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
            Reset
          </button>
          <button onClick={downloadCode} className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">
            Download .py
          </button>
          <select
            value={example}
            onChange={(event) => loadExample(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          >
            {Object.keys(examples).map((name) => (
              <option key={name} value={name}>{name} example</option>
            ))}
          </select>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-800">
          <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
            <span className="text-sm font-medium">main.py</span>
          </div>
          <Editor
            height="420px"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              fontSize: 15,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="bg-slate-900 px-4 py-3 font-medium">Program Input</div>
            <textarea
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              rows={5}
              placeholder="Enter input values, one per line"
              className="w-full resize-y bg-slate-950 p-4 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="px-4 pb-3 text-xs text-slate-500">
              For programs using input(), provide values on separate lines.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
              <span className="font-medium">Output</span>
              <button onClick={() => setOutput("")} className="text-sm text-slate-400 hover:text-white">
                Clear
              </button>
            </div>
            <pre className="min-h-32 whitespace-pre-wrap break-words p-4 text-sm text-emerald-300">
              {output}
            </pre>
          </div>
        </section>

        <p className="text-xs text-slate-500">
          Python executes in your browser. This is a learning tool, not a full operating-system environment.
        </p>
      </main>
    </div>
  );
}
