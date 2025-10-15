import { invoke } from "@tauri-apps/api/core";
import { useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import preactLogo from "./assets/preact.svg";
import tailwindLogo from "./assets/tailwindcss.svg";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main class="pt-[10vh] flex flex-col justify-center text-center">
      <Card class="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle class="text-3xl font-bold">Welcome to Tauri + Preact + Tailwind</CardTitle>
          <CardDescription>
            Click on the Tauri, Vite, Preact, and Tailwind logos to learn more.
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="flex justify-center gap-4">
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
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener"
              class="font-medium text-[#646cff] hover:text-[#535bf2] dark:hover:text-[#24c8db]"
            >
              <img
                src={tailwindLogo}
                class="h-24 p-6 transition-all duration-700 hover:drop-shadow-[0_0_2em_#24c8db]"
                alt="Tailwind logo"
              />
            </a>
          </div>

          <form
            class="flex justify-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <Input
              id="greet-input"
              onInput={(e: Event) => setName((e.target as HTMLInputElement).value)}
              placeholder="Enter a name..."
              class="w-64"
            />
            <Button type="submit">Greet</Button>
          </form>

          {greetMsg && (
            <p class="text-lg font-medium text-green-600 dark:text-green-400">{greetMsg}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
