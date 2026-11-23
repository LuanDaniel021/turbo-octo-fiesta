
const DATA_SOURCE = "./data";

let DATA_POINTS = null;

const DATA_FILES = [
    "pontos.json"
];

const DATA_READY = Promise.all(
    DATA_FILES.map(async file => {
        const response = await fetch(`${DATA_SOURCE}/${file}`);
        if (!response.ok) {
            throw new Error(`Falha ao carregar ${file}: ${response.status}`);
        }
        return [file, await response.json()];
    })
)
.then(
    files => {
        const data = Object.fromEntries(files);

        DATA_POINTS = data["pontos.json"];

    }
)
.catch(
    error => {
        console.error(
            "Falha ao carregar os dados da aplicação:", error
        );
        throw error;
    }
);
