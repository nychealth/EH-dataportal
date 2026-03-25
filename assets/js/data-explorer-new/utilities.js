console.log('>> utilities.js')

function getGeoFile(mapGeoType) {

        if (mapGeoType === "NTA2010") {
        return 'NTA_2010.topo.json';

    } else if (mapGeoType === "NTA2020") {
        return 'NTA_2020.topo.json';

    } else if (mapGeoType === "NYHarbor") {
        return 'ny_harbor.topo.json';

    } else if (mapGeoType === "CD") {
        return 'CD.topo.json';

    } else if (mapGeoType === "CDTA2020") {
        return 'CDTA_2020.topo.json';

    } else if (mapGeoType === "PUMA2010") {
        return 'PUMA2010.topo.json';

    } else if (mapGeoType === "PUMA2020") {
        return 'PUMA2020.topo.json';

    } else if (mapGeoType === "Subboro") {
        return 'PUMA_or_Subborough.topo.json';

    } else if (mapGeoType === "UHF42") {
        return 'UHF42.topo.json';

    } else if (mapGeoType === "UHF34") {
        return 'UHF34.topo.json';

    } else if (mapGeoType === "NYCKIDS2017") {
        return 'NYCKids_2017.topo.json';

    } else if (mapGeoType === "NYCKIDS2019") {
        return 'NYCKids_2019.topo.json';

    } else if (mapGeoType === "NYCKIDS2021") {
        return 'NYCKids_2021.topo.json';

    } else if (mapGeoType === "NYCKIDS2023") {
        return 'NYCKids_2023.topo.json';

    } else if (mapGeoType === "Borough") {
        return 'borough.topo.json';

    } else if (mapGeoType === "RMZ") {
        return 'RMZ.topo.json';   
    }
}

function replaceTimePeriodID() {

}

function getFinestGeography() {}