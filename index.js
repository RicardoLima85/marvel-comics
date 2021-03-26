const fs = require('fs');
const fsPromises = require('fs').promises;
const axios = require('axios');
const { Parser } = require('json2csv');
const moment = require('moment');
const md5 = require('md5');

const json2csvParser = new Parser({ delimiter: ';' });
const TIMESTAMP = moment().format();

const API_KEY = '30fc9ec87b49604fa0a71b90eea47f38';
const PRIVATE_KEY = '15560e338e34acf2207cfea97ada53670d58844f';
const OUTPUT_FILE_PATH = './output/result.csv';
const BASE_ROUTE = `https://gateway.marvel.com:443/v1/public`;

const CHARACTER_NAME = 'wolverine';
const COMICS_AMOUNT = 15;

const HASH = md5(TIMESTAMP+PRIVATE_KEY+API_KEY);

function concatQueryParams(route, params) {
    let concatedRoute = route;
    for (const [key, value] of Object.entries(params)) {
        concatedRoute += `&${key}=${value}`;
    }
    return concatedRoute;
}

function mountRoute(path, queryParams) {
    let mountedRoute = `${BASE_ROUTE}/${path}?`;
    let params = {
        'ts': TIMESTAMP,
        'hash': HASH,
        'apikey': API_KEY,
        ...queryParams,
    };
    return concatQueryParams(mountedRoute, params);
}

async function getCharacterIdFromName(characterName) {
    const fetchCharactersRoute = mountRoute('characters', {
        'name': characterName,
    });
    const charactersResult = await axios.get(fetchCharactersRoute);
    return charactersResult.data.data.results[0].id;
}

async function getComicsFromCharacterId(characterId){
    const fetchComicsRoute = mountRoute('comics', {
        'formatType': 'comic',
        'characters': characterId
    });
    const routeResult = await axios.get(fetchComicsRoute);
    return routeResult.data.data.results;
}

async function getFirstNComicsFromCharacterId(characterId, comicsAmount) {
    const characterComics = await getComicsFromCharacterId(characterId);
    return characterComics.slice(0, comicsAmount);
}

async function saveObjectToCSV(jsonObject, outputFilePath) {
    const resultCsv = json2csvParser.parse(jsonObject);
    return fsPromises.writeFile(outputFilePath, resultCsv);
}


async function main() {
    const characterId = await getCharacterIdFromName(CHARACTER_NAME);
    const first15CharacterComics = await getFirstNComicsFromCharacterId(characterId, COMICS_AMOUNT);
    await saveObjectToCSV(first15CharacterComics, OUTPUT_FILE_PATH);
}

main()
    .then(() => {
        console.log('Execução finalizada!');
        console.log(`Arquivo de saída: ${OUTPUT_FILE_PATH}`);
        console.log(`O arquivo contem os ${COMICS_AMOUNT} primeiros comics do ${CHARACTER_NAME}`);
    })
    .catch((error) => {
        console.log('Houve um erro:');
        console.log(error);
    });