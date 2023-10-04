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

    var result = {};
    for (let row of json.data) {
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

async function add_word(dict, nl, en) {
    const response = await fetch(
        clickhouse_url,
        {
            method: "POST",
            body: "INSERT INTO words (dict, nl, en, tags) FORMAT JSONEachRow " + JSON.stringify(
            {
                dict: dict,
                nl: nl,
                en: en,
                tags: []
            })
        });

    if (!response.ok) {
        show(error);
        throw new Error(`Saving failed\nHTTP status ${response.status}`);
    }

    //history.pushState(null, null, window.location.pathname.replace(/(\?.+)?$/, `?${curr_fingerprint}/${curr_hash}${anchor}`));
}

export { DICTS, add_word };
