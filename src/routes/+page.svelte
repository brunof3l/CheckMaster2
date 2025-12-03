<script lang="ts">
  export let data: { abertos: number; andamento: number; finalizados: number; acima48h: number }
  const cards = [
    { title: 'Abertos', value: data.abertos, href: '/checklists?filter=abertos' },
    { title: 'Em andamento', value: data.andamento, href: '/checklists?filter=andamento', badge: data.acima48h },
    { title: 'Finalizados', value: data.finalizados, href: '/checklists?filter=finalizados' },
  ]
</script>

<div class="min-h-screen bg-[#0b0b0c] text-white">
  <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,0)_80%,rgba(255,255,255,0.04)_100%)] pointer-events-none"></div>
  <div class="relative mx-auto max-w-6xl px-6 py-10">
    <h1 class="text-2xl font-semibold tracking-tight">CheckMaster</h1>
    <p class="text-sm text-zinc-400 mt-1">Visão geral</p>

    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each cards as c}
        <div class="bg-[#18181b] rounded-xl shadow-sm border border-zinc-800/60 p-5 hover:-translate-y-0.5 hover:shadow-md transition-transform">
          <div class="flex items-center justify-between">
            <div class="text-zinc-300">{c.title}</div>
            {#if c.badge && c.badge > 0}
              <span class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Acima de 48h: {c.badge}</span>
            {/if}
          </div>
          <div class="mt-3 text-4xl font-bold tracking-tight">{c.value}</div>
          <a href={c.href} class="mt-4 inline-flex items-center justify-center w-full rounded-lg bg-[#3B82F6] text-white py-2 text-sm font-medium hover:bg-[#2563eb] transition-colors">Ver lista</a>
        </div>
      {/each}
    </div>

    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <a href="/checklists/novo" class="group bg-[#0f172a] rounded-xl border border-zinc-800/60 p-5 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-transform">
        <div>
          <div class="text-zinc-200 font-medium">Iniciar checklist</div>
          <div class="text-zinc-400 text-sm mt-1">Crie um novo checklist</div>
        </div>
        <div class="w-12 h-12 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">➕</div>
      </a>

      <a href="/fornecedores/novo" class="group bg-[#0f172a] rounded-xl border border-zinc-800/60 p-5 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-transform">
        <div>
          <div class="text-zinc-200 font-medium">Cadastrar fornecedor</div>
          <div class="text-zinc-400 text-sm mt-1">Adicione um novo fornecedor</div>
        </div>
        <div class="w-12 h-12 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">🏷️</div>
      </a>

      <a href="/relatorios/exportar" class="group bg-[#0f172a] rounded-xl border border-zinc-800/60 p-5 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-transform">
        <div>
          <div class="text-zinc-200 font-medium">Exportar PDF</div>
          <div class="text-zinc-400 text-sm mt-1">Gere relatórios em PDF</div>
        </div>
        <div class="w-12 h-12 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">📄</div>
      </a>
    </div>
  </div>
</div>

