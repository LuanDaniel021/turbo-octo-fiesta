
async function loader(source, files)
{
    return Promise.all(
        files.map(
            async ( file ) => {
                const response = await fetch(`${source}/${file}`);
                
                if (!response.ok) {
                    throw new Error(`Falha ao carregar ${file}: ${response.status}`);
                }

                return [file, await response.json()];
            }
        )
    )
    .then(
        ( data ) => {
            return Object.fromEntries(data);
        }
    )
    ;
}
