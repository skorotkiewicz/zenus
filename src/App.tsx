import { invoke } from "@tauri-apps/api/core";
import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main class="pt-[10vh] flex flex-col justify-center text-center">
      <h1 class="text-center text-3xl font-bold mb-8">Welcome to Tauri + Preact</h1>

      <div class="flex justify-center mb-4">
        <a
          href="https://vite.dev"
          target="_blank"
          rel="noopener"
          class="font-medium text-[#646cff] hover:text-[#535bf2] dark:hover:text-[#24c8db]"
        >
          <img
            src="/vite.svg"
            class="h-24 p-6 transition-all duration-700 hover:drop-shadow-[0_0_2em_#747bff]"
            alt="Vite logo"
          />
        </a>
        <a
          href="https://tauri.app"
          target="_blank"
          rel="noopener"
          class="font-medium text-[#646cff] hover:text-[#535bf2] dark:hover:text-[#24c8db]"
        >
          <img
            src="/tauri.svg"
            class="h-24 p-6 transition-all duration-700 hover:drop-shadow-[0_0_2em_#24c8db]"
            alt="Tauri logo"
          />
        </a>
        <a
          href="https://preactjs.com"
          target="_blank"
          rel="noopener"
          class="font-medium text-[#646cff] hover:text-[#535bf2] dark:hover:text-[#24c8db]"
        >
          <img
            src={preactLogo}
            class="h-24 p-6 transition-all duration-700 hover:drop-shadow-[0_0_2em_#673ab8]"
            alt="Preact logo"
          />
        </a>
      </div>

      <p class="mb-6">Click on the Tauri, Vite, and Preact logos to learn more.</p>

      <form
        class="flex justify-center mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          class="rounded-lg border border-transparent px-5 py-2.5 text-base font-medium text-[#0f0f0f] bg-white transition-colors duration-250 shadow-[0_2px_2px_rgba(0,0,0,0.2)] outline-none mr-1.5 dark:text-white dark:bg-[#0f0f0f98]"
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button
          type="submit"
          class="rounded-lg border border-transparent px-5 py-2.5 text-base font-medium text-[#0f0f0f] bg-white transition-colors duration-250 shadow-[0_2px_2px_rgba(0,0,0,0.2)] outline-none cursor-pointer hover:border-[#396cd8] active:border-[#396cd8] active:bg-[#e8e8e8] dark:text-white dark:bg-[#0f0f0f98] dark:active:bg-[#0f0f0f69]"
        >
          Greet
        </button>
      </form>

      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
