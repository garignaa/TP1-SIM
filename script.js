function mostrarParametros() {
    let distribucion = document.getElementById("distribucion").value;
    let div = document.getElementById("parametros");
    div.innerHTML = "";

    if (distribucion === "uniforme") {
        div.innerHTML = `
            <label for="cotaInferior">Cota Inferior (a):</label>
            <input type="number" id="cotaInferior" value="0">
            <label for="cotaSuperior">Cota Superior (b):</label>
            <input type="number" id="cotaSuperior" value="1">
        `;
    } else if (distribucion === "exponencial") {
        div.innerHTML = `
            <label for="lambda">Lambda (λ):</label>
            <input type="number" id="lambda">
            <label for="media">Media (μ):</label>
            <input type="number" id="media" oninput="sincronizarLambda()">
        `;
    } else if (distribucion === "poisson") {
        div.innerHTML = `
            <label for="mediaPoisson">Media (μ):</label>
            <input type="number" id="mediaPoisson" value="3">
        `;
    } else {
        div.innerHTML = `
            <label for="media">Media (μ):</label>
            <input type="number" id="media" value="0">
            <label for="desviacion">Desviación Estándar (σ):</label>
            <input type="number" id="desviacion" value="1">
        `;
    }
}

function sincronizarLambda() {
    let media = parseFloat(document.getElementById("media").value);
    if (media > 0) {
        document.getElementById("lambda").value = (1 / media).toFixed(4);
    }
}

function generarUniforme(a, b) {
    let R = Math.random();
    let X = a + (b - a) * R;
    return { valor: X, calculo: `X = ${a} + (${b} - ${a}) * ${R.toFixed(4)} = ${X.toFixed(4)}` };
}

function generarExponencial(lambda) {
    let R = Math.random();
    let X = -Math.log(1 - R) / lambda;
    return { valor: X, calculo: `X = -ln(1 - ${R.toFixed(4)}) / ${lambda} = ${X.toFixed(4)}` };
}

function generarPoisson(media) {
    let L = Math.exp(-media);
    let p = 1.0, k = 0, R;
    do {
        k++;
        R = Math.random();
        p *= R;
    } while (p > L);
    return { valor: k - 1, calculo: `Poisson con μ=${media}, valores R acumulados: ${R.toFixed(4)}` };
}

function generarNormalBoxMuller(media, desviacion) {
    let U1 = Math.random(), U2 = Math.random();
    let Z0 = Math.sqrt(-2 * Math.log(U1)) * Math.cos(2 * Math.PI * U2);
    let Z1 = Math.sqrt(-2 * Math.log(U1)) * Math.sin(2 * Math.PI * U2);
    return [
        { valor: media + Z0 * desviacion, calculo: `X1 = ${media} + ${Z0.toFixed(4)} * ${desviacion}` },
        { valor: media + Z1 * desviacion, calculo: `X2 = ${media} + ${Z1.toFixed(4)} * ${desviacion}` }
    ];
}

function generarNormalConvolucion(media, desviacion) {
    let suma = 0;
    for (let i = 0; i < 12; i++) {
        suma += Math.random();
    }
    let Z = suma - 6;
    let X = media + Z * desviacion;
    return { valor: X, calculo: `X = ${media} + (${suma.toFixed(4)} - 6) * ${desviacion}` };
}

let histogramaChart = null; // Variable global para el gráfico

function generar() {
    let cantidad = parseInt(document.getElementById("cantidad").value);
    let distribucion = document.getElementById("distribucion").value;
    let tablaBody = document.getElementById("tablaBody");
    tablaBody.innerHTML = ""; // Limpia la tabla antes de agregar nuevos valores
    let valores = []; // Almacenar valores para el histograma

    let count = 0; // Contador para asegurarnos de que se generen la cantidad correcta de números

    while (count < cantidad) {
        let resultado;

        if (distribucion === "uniforme") {
            let a = parseFloat(document.getElementById("cotaInferior").value);
            let b = parseFloat(document.getElementById("cotaSuperior").value);
            resultado = generarUniforme(a, b);
            valores.push(resultado.valor);
            agregarFila(count + 1, resultado.valor, resultado.calculo);
            count++;

        } else if (distribucion === "exponencial") {
            let lambda = parseFloat(document.getElementById("lambda").value);
            resultado = generarExponencial(lambda);
            valores.push(resultado.valor);
            agregarFila(count + 1, resultado.valor, resultado.calculo);
            count++;

        } else if (distribucion === "poisson") {
            let media = parseFloat(document.getElementById("mediaPoisson").value);
            resultado = generarPoisson(media);
            valores.push(resultado.valor);
            agregarFila(count + 1, resultado.valor, resultado.calculo);
            count++;

        } else if (distribucion === "normalBoxMuller") {
            let media = parseFloat(document.getElementById("media").value);
            let desviacion = parseFloat(document.getElementById("desviacion").value);

            let resultados = generarNormalBoxMuller(media, desviacion);

            if (count < cantidad) {
                valores.push(resultados[0].valor);
                agregarFila(count + 1, resultados[0].valor, resultados[0].calculo);
                count++;
            }

            if (count < cantidad) {
                valores.push(resultados[1].valor);
                agregarFila(count + 1, resultados[1].valor, resultados[1].calculo);
                count++;
            }

        } else if (distribucion === "normalConvolucion") {
            let media = parseFloat(document.getElementById("media").value);
            let desviacion = parseFloat(document.getElementById("desviacion").value);
            resultado = generarNormalConvolucion(media, desviacion);
            valores.push(resultado.valor);
            agregarFila(count + 1, resultado.valor, resultado.calculo);
            count++;
        }
    }

    actualizarHistograma(valores);
}

function agregarFila(index, valor, calculo) {
    let tablaBody = document.getElementById("tablaBody");
    let row = tablaBody.insertRow();
    
    let cellIndex = row.insertCell(0);
    let cellValor = row.insertCell(1);
    let cellCalculo = row.insertCell(2);

    cellIndex.textContent = index;
    cellValor.textContent = valor.toFixed(4);
    cellCalculo.textContent = calculo;
}

function actualizarHistograma(valores) {
    let ctx = document.getElementById("histograma").getContext("2d");

    // Crear bins para agrupar datos en intervalos
    let numBins = 10; // Número de barras en el histograma
    let min = Math.min(...valores);
    let max = Math.max(...valores);
    let binWidth = (max - min) / numBins;
    let bins = Array(numBins).fill(0);

    valores.forEach(valor => {
        let index = Math.floor((valor - min) / binWidth);
        if (index >= numBins) index = numBins - 1; // Asegurar que no salga del rango
        bins[index]++;
    });

    let labels = [];
    for (let i = 0; i < numBins; i++) {
        labels.push((min + i * binWidth).toFixed(2));
    }

    if (histogramaChart) {
        histogramaChart.destroy(); // Eliminar gráfico anterior si existe
    }

    histogramaChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Frecuencia",
                data: bins,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Intervalos"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Frecuencia"
                    },
                    beginAtZero: true
                }
            }
        }
    });
}