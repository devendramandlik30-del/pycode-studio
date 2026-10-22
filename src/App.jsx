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
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [example, setExample] = useState("Greeting");

  async function runCode() {
    if (running) return;

    setRunning(true);
    setOutput("Starting Python...");

    try {
      const py = await getPyodide();

      py.globals.set("user_input_text", userInput);
      await py.runPythonAsync(`
import builtins
_input_lines = iter(user_input_text.splitlines())
builtins.input = lambda prompt="": next(_input_lines, "")
      `);

      let result = "";

      py.setStdout({
        batched: (text) => {
          result += text + "\n";
        },
      });

      py.setStderr({
        batched: (text) => {
          result += text + "\n";
        },
      });

      await py.runPythonAsync(code);

      setOutput(result.trimEnd() || "Program finished with no output.");
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  }

  function resetCode() {
    setCode(starterCode);
    setUserInput("Devendra");
    setOutput("");
    setExample("Greeting");
  }

  function loadExample(name) {
    setExample(name);
    setCode(examples[name]);
    setOutput("");
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

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <header className="border-b border-white/10 bg-[#0b1020]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950">
              Py
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                PyCode Studio
              </h1>
              <p className="text-xs text-slate-400">
                Write Python. Run instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Python 3
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Online Python Editor
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your coding workspace
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Write your code, press Run, and see the result below.
            </p>
          </div>

          <select
            value={example}
            onChange={(event) => loadExample(event.target.value)}
            aria-label="Choose a Python example"
            className="w-full rounded-xl border border-white/10 bg-[#151c30] px-4 py-3 text-sm outline-none transition focus:border-emerald-400 sm:w-52"
          >
            {Object.keys(examples).map((name) => (
              <option key={name} value={name}>
                {name} example
              </option>
            ))}
          </select>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11182a] shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">
                main.py
              </span>
            </div>
            <span className="text-xs text-slate-500">Python file</span>
          </div>

          <Editor
            height="min(55vh, 520px)"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 18, bottom: 18 },
              roundedSelection: true,
              lineNumbers: "on",
              tabSize: 4,
              wordWrap: "on",
              suggestOnTriggerCharacters: true,
            }}
          />

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0e1525] p-3 sm:p-4">
            <button
              onClick={runCode}
              disabled={running}
              className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
            >
              {running ? "Running..." : "▶  Run Code"}
            </button>

            <button
              onClick={resetCode}
              disabled={running}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Reset
            </button>

            <button
              onClick={downloadCode}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              ↓ Download .py
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11182a]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <h3 className="font-semibold">Console</h3>
              <p className="mt-1 text-xs text-slate-500">
                Provide input and view your program results here.
              </p>
            </div>

            <button
              onClick={() => setOutput("")}
              className="rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              Clear output
            </button>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
              <label
                htmlFor="program-input"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Input <span className="font-normal text-slate-500">(optional)</span>
              </label>

              <textarea
                id="program-input"
                value={userInput}
                onChange={(event) => setUserInput(event.target.value)}
                rows={3}
                placeholder={"Enter values, one per line\nExample: Devendra"}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1020] p-3 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-400"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                For input(), enter each value on a new line. Leave blank if
                your program needs no input.
              </p>
            </div>

            <div className="min-w-0 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                <span className="text-emerald-400">&gt;_</span>
                Output
              </div>

              <pre className="min-h-24 whitespace-pre-wrap break-words rounded-xl bg-[#0b1020] p-4 font-mono text-sm leading-6 text-emerald-300">
                {output || (
                  <span className="text-slate-600">
                    Your results will appear here after you run your code.
                  </span>
                )}
              </pre>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Made for learning Python, one line at a time.</span>
          <span>Runs in your browser with Pyodide.</span>
        </footer>
      </main>
    </div>
  );
}
