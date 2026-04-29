async function gerarImagemEEnviar() {
    if(carrinho.length === 0) return alert("Adicione itens primeiro!");

    const cliIdx = document.getElementById('sel-cliente').value;
    const cliente = clientes[cliIdx] || {nome: "Consumidor", cidade: "Geral", tel: ""};

    document.getElementById('print-cliente').innerText = cliente.nome;
    document.getElementById('print-cidade').innerText = cliente.cidade;
    
    let totalGeral = 0;
    document.getElementById('print-corpo').innerHTML = carrinho.map(it => {
        const sub = it.preco * it.qtd;
        totalGeral += sub;
        return `<tr><td>${it.qtd}</td><td>${it.nome}</td><td>R$ ${it.preco.toFixed(2)}</td><td>R$ ${sub.toFixed(2)}</td></tr>`;
    }).join('');
    document.getElementById('print-total').innerText = `Total : R$ ${totalGeral.toFixed(2)}`;

    const canvas = await html2canvas(document.querySelector("#espelho-print"), { scale: 2 });
    canvas.toBlob(async (blob) => {
        try {
            // Copia a imagem para a área de transferência
            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);
            
            // Confirmação do usuário e redirecionamento para o WhatsApp
            if(confirm("Imagem copiada! Clique em OK para abrir o WhatsApp e enviar a imagem.")) {
                const link = cliente.tel 
                    ? `whatsapp://send?phone=${cliente.tel}` 
                    : `whatsapp://send`;
                window.location.href = link;
            }
        } catch (err) {
            console.error("Erro:", err);
            alert("Erro ao copiar imagem. Tente novamente.");
        }
    });
}
