const clickhouse_url = "https://bjfk2mf24z.eu-west-1.aws.clickhouse-staging.com/?user=lang";

async function load() {
    const response = await fetch(
        clickhouse_url,
        { method: "POST", body: `SELECT * FROM words FORMAT JSON` });

    function onError() {
        throw new Error(`Load failed\nHTTP status ${response.status}\nMessage: ${response.body}`);
    }

    if (!response.ok) onError();
    const json = await response.json();

    console.log(result);

    var result = {};
    for (let row of json.data) {
        console.log(row);
        if (!(row.dict in result)) {
            result[row.dict] = [];
        }
        result[row.dict].push({
            nl: row.nl,
            en: row.en
        });
    }

    return result;
}

var DICTS = await load();

export default DICTS;
