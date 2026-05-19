let mapComponent; // reference to <arcgis-map> element
let mapView; // reference to the underlying MapView

//**********Tab Functions**********

async function openTab(evt, tabName) {
    // Hide all tab content
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }

    // Remove active highlight from all tab buttons
    const tablinks = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    // Show the chosen tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add("active");
    } else {
        console.error(`Tab element with id "${tabName}" not found`);
        return;
    }

    evt.currentTarget.classList.add("active");

    // Initialize map component if needed
    if (tabName === "mapView" && !mapView) {
        await initializeMapComponent();
    }
}

//**********ArcGIS Map Component Setup**********

async function initializeMapComponent() {
    // Get reference to the <arcgis-map> component
    mapComponent = document.getElementById("arcmap");
    
    if (!mapComponent) {
        console.error("arcgis-map element not found");
        return;
    }

    // Wait for the view to be ready
    return new Promise((resolve) => {
        mapComponent.addEventListener("arcgisViewReadyChange", async (event) => {
            // Get the underlying MapView from the component
            mapView = mapComponent.view;
            const webmap = mapView.map;
            
            console.log("MapView ready from component:", mapView);

            // ========== ADD THIS DIAGNOSTIC CODE ==========
            // Debug: Watch for map clicks
            mapView.on("click", (event) => {
                console.log("🖱️ Map clicked at:", event.mapPoint);
            });

            // Debug: Watch for popup state changes
            const [reactiveUtils] = await $arcgis.import([
                "@arcgis/core/core/reactiveUtils.js"
            ]);

            reactiveUtils.watch(
                () => mapView.popup?.visible,
                (visible) => {
                    console.log("👁️ Popup visible:", visible);
                }
            );

            reactiveUtils.watch(
                () => mapView.popup?.selectedFeature,
                (feature) => {
                    if (feature) {
                        console.log("📍 Feature selected:", feature.attributes);
                    } else {
                        console.log("📍 No feature selected");
                    }
                }
            );

            reactiveUtils.watch(
                () => mapView.popup?.content,
                (content) => {
                    console.log("📄 Popup content changed:", content);
                }
            );
            // ========== END DIAGNOSTIC CODE ==========

            // Initialize all map features in order
            await setupSearchWidget(webmap);
            await setupCommunityDistrictZoom(mapView, webmap);
            
            // IMPORTANT: Set up popup interception LAST, after all other features
            setupPopupLinkInterception();
            
            // Set up Property History tab state management
            await setupPropertyHistoryTab();
            
            resolve();
        });
    });
}
//**********Search Widget Setup**********

async function setupSearchWidget(webmap) {
    const searchEl = document.getElementById("arcsearch");
    
    // Find the inspection layer
    const inspectionLayer = webmap.allLayers.find(
        l => l.title === "NYC Health Department Inspections"
    );

    if (!inspectionLayer) {
        console.warn("Inspection layer not found");
        return;
    }

    // Add layer as search source
    searchEl.sources = [
        ...searchEl.sources, // keep existing geocoder
        {
            layer: inspectionLayer,
            searchFields: ["BBL"],
            displayField: "BBL",
            exactMatch: false,
            outFields: ["*"],
            name: "Inspection BBL",
            placeholder: "Search BBL",
            maxResults: 6,
            maxSuggestions: 6
        }
    ];
    
    console.log("Search widget configured");
}

//**********Community District Zoom & Filter**********

async function setupCommunityDistrictZoom(view, webmap) {
    // Find layers
    const CDLayer = webmap.allLayers.find(l => l.title === "Community Districts");
    const inspectionLayer = webmap.allLayers.find(l => l.title === "NYC Health Department Inspections");
    const actionLayer = webmap.allLayers.find(l => l.title === "NYC Health Department Action");

    if (!CDLayer) {
        console.warn("CD layer not found in webmap");
        return;
    }

    // Create dropdown
    const selectDiv = document.createElement("div");
    selectDiv.style.backgroundColor = "white";
    selectDiv.style.padding = "5px";
    selectDiv.innerHTML = `<select id="CDSelect"><option value="">Community Board (All)</option></select>`;
    view.ui.add(selectDiv, "bottom-left");

    // Query community districts
    const query = CDLayer.createQuery();
    query.outFields = ["BoroLabel"];
    query.returnGeometry = false;
    query.where = "1=1";
    query.orderByFields = ["BoroLabel"];

    const results = await CDLayer.queryFeatures(query);
    const select = selectDiv.querySelector("#CDSelect");
    
    results.features.forEach(feature => {
        const CD = feature.attributes.BoroLabel;
        const opt = document.createElement("option");
        opt.value = CD;
        opt.textContent = CD;
        select.appendChild(opt);
    });

    // Handle dropdown change
    select.addEventListener("change", async () => {
        const selectedCD = select.value;

        // Clear filters if nothing selected
        if (!selectedCD) {
            if (inspectionLayer) inspectionLayer.definitionExpression = null;
            if (actionLayer) actionLayer.definitionExpression = null;
            return;
        }

        // Apply filters
        if (inspectionLayer) {
            inspectionLayer.definitionExpression = `NewCD = '${selectedCD}'`;
            console.log(`Filtering inspections to CD: ${selectedCD}`);
        }
        if (actionLayer) {
            actionLayer.definitionExpression = `NewCD = '${selectedCD}'`;
            console.log(`Filtering actions to CD: ${selectedCD}`);
        }

        // Zoom to selected district
        const zoomQuery = CDLayer.createQuery();
        zoomQuery.where = `BoroLabel = '${selectedCD}'`;
        zoomQuery.returnGeometry = true;

        const CDResult = await CDLayer.queryFeatures(zoomQuery);

        if (CDResult.features.length > 0) {
            const geometry = CDResult.features[0].geometry;
            let centerPoint;
            
            if (geometry.extent) centerPoint = geometry.extent.center;
            else if (geometry.centroid) centerPoint = geometry.centroid;
            
            if (centerPoint) {
                await view.goTo({
                    target: centerPoint,
                    scale: 10000
                });
            }
        }
    });
    
    console.log("Community District zoom configured");
}

//**********Popup Link Interception**********

function setupPopupLinkInterception() {
    // Attach to the stable map container, NOT popup.container which gets rebuilt
    // on every new feature selection when popup is already open.
    const mapContainer = mapView.container;

    if (!mapContainer) {
        console.error("mapView.container not found");
        return;
    }

    console.log("Attaching popup link listener to stable map container");

    mapContainer.addEventListener("click", function (evt) {
        // Only act if the popup is visible
        if (!mapView.popup?.visible) return;

        // Walk up the DOM to find an <a> tag
        const link = evt.target.closest("a");
        if (!link) return;

        let href = link.getAttribute("href"); // Use getAttribute to get the raw value
        if (!href) return;

        let targetUrl = href;

        try {
            // Resolve relative URLs and handle Google Translate proxy
            const urlObj = new URL(href, window.location.href);

            if (urlObj.hostname.includes("translate.google")) {
                const originalUrl = urlObj.searchParams.get("u");
                if (originalUrl) targetUrl = originalUrl;
            } else {
                targetUrl = urlObj.href;
            }
        } catch (err) {
            console.warn("Invalid link href:", href);
            return;
        }

        console.log("Popup link clicked:", targetUrl);

        // Check if it's a property history link
        if (targetUrl.includes("tabulator.html")) {
            evt.preventDefault();
            evt.stopPropagation();

            const urlParams = new URL(targetUrl).searchParams;
            const bbl = urlParams.get("bbl");
            const address = urlParams.get("addr");

            console.log("Opening property history for BBL:", bbl, "Address:", address);

            setPropertyHistoryTabEnabled(true);
            viewPropertyHistory(bbl, address);
        }

    }, true); // Capture phase — fires before the browser processes target="_blank"
}

//**********Property History Tab Management**********

async function setupPropertyHistoryTab() {
    // Grey out tab on initial load
    setPropertyHistoryTabEnabled(false);

    // Import reactiveUtils to watch popup visibility
    const [reactiveUtils] = await $arcgis.import([
        "@arcgis/core/core/reactiveUtils.js"
    ]);

    // Watch popup visibility - disable tab when popup closes
    reactiveUtils.watch(
        () => mapView.popup.visible,
        (visible) => {
            if (!visible) {
                setPropertyHistoryTabEnabled(false);
            }
        }
    );
}

function setPropertyHistoryTabEnabled(enabled) {
    const tabButton = Array.from(document.getElementsByClassName("tab-button"))
        .find(btn => btn.textContent.trim() === "Property History");
    if (!tabButton) return;

    if (enabled) {
        tabButton.classList.remove("disabled");
        tabButton.removeAttribute("disabled");
    } else {
        tabButton.classList.add("disabled");
        tabButton.setAttribute("disabled", true);
    }
}

function viewPropertyHistory(bbl, address) {
    // Populate Property History section
    document.getElementById("propertyBBL").textContent = bbl || "[no BBL]";
    document.getElementById("propertyAddress").textContent = address || "[no address]";

    // Switch to Property History tab
    openTabFromMap("propHis");

    // Fetch and display inspection history
    fetchPropertyHistory(bbl);
}

//**********Helper: Switch to Property History Tab**********

function openTabFromMap(tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    
    const tablinks = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    
    const tabElement = document.getElementById(tabName);
    if (tabElement) tabElement.classList.add("active");

    // Highlight the Property History tab button
    const propHisButton = Array.from(tablinks).find(
        (btn) => btn.textContent.trim() === "Property History"
    );
    if (propHisButton) propHisButton.classList.add("active");
}

//**********Fetch Property History from NYC Open Data**********

async function fetchPropertyHistory(bbl) {
    const loading = document.getElementById("loadingIndicator");
    const historyDiv = document.getElementById("property-history");

    loading.style.display = "block";
    historyDiv.innerHTML = "";

    try {
        // Calculate cutoff date (5 years ago from today)
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const cutoffDate = fiveYearsAgo.toISOString().split("T")[0];

        const url = `https://data.cityofnewyork.us/resource/p937-wjvj.json?$select=inspection_date,inspection_type,result&$where=bbl=${bbl} AND inspection_date >= '${cutoffDate}'`;
        console.log("Fetching property history from:", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch property history");

        const data = await response.json();

        if (!data || data.length === 0) {
            historyDiv.innerHTML = "<p>No inspection records found.</p>";
            return;
        }

        // Sort by date descending
        data.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));

        // Build table
        let table = `
            <table class="table table-striped" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background:#f4f4f4; text-align:left;">
                        <th style="padding:8px; border-bottom:1px solid #ccc;">Inspection Date</th>
                        <th style="padding:8px; border-bottom:1px solid #ccc;">Inspection Type</th>
                        <th style="padding:8px; border-bottom:1px solid #ccc;">Result</th>
                    </tr>
                </thead>
                <tbody>`;

        data.forEach((item) => {
            table += `<tr>
                <td style="padding:8px; border-bottom:1px solid #eee;">${item.inspection_date ? new Date(item.inspection_date).toLocaleDateString() : ""}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${item.inspection_type || ""}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">${item.result || ""}</td>
            </tr>`;
        });

        table += "</tbody></table>";
        historyDiv.innerHTML = table;
    } catch (err) {
        console.error(err);
        historyDiv.innerHTML = "<p>Error loading inspection history.</p>";
    } finally {
        loading.style.display = "none";
    }
}

//**********Initialize on Page Load - SINGLE ENTRY POINT**********

document.addEventListener("DOMContentLoaded", async function () {
    const mapTab = document.getElementById("mapView");
    if (mapTab && mapTab.classList.contains("active")) {
        await initializeMapComponent();
    }
});