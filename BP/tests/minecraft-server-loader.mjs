const stubUrl = new URL("./minecraft-server-stub.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@minecraft/server") return { url: stubUrl, shortCircuit: true };
  return nextResolve(specifier, context);
}
