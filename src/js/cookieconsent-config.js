/**
 * Cookie Consent Configuration
 * https://cookieconsent.orestbida.com/
 */
CookieConsent.run({
  guiOptions: {
    consentModal: {
      layout: "box",
      position: "bottom left",
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: "box",
      position: "right",
      equalWeightButtons: true,
      flipButtons: false,
    },
  },

  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
    },
    analytics: {
      autoClear: {
        cookies: [{ name: /^_ga/ }, { name: "_gid" }],
      },
    },
  },

  language: {
    default: "fi",
    translations: {
      fi: {
        consentModal: {
          title: "Analytiikka vaatii evästeitä",
          description:
            "Sivustolla on käytössä Google Analytics ja sen toiminta vaatii evästeiden hyväksynnän. Voit kieltäytyä evästeestä.",
          acceptAllBtn: "Hyväksy kaikki",
          acceptNecessaryBtn: "Vain välttämättömät",
          showPreferencesBtn: "Muokkaa asetuksia",
          _footer: '<a href="/tietosuoja">Tietosuojaseloste</a>',
        },
        preferencesModal: {
          title: "Evästeasetukset",
          acceptAllBtn: "Hyväksy kaikki",
          acceptNecessaryBtn: "Vain välttämättömät",
          savePreferencesBtn: "Tallenna asetukset",
          closeIconLabel: "Sulje",
          serviceCounterLabel: "Palvelu|Palvelut",
          sections: [
            {
              title: "Evästeiden käyttö",
              description:
                "Evästeet ovat pieniä tekstitiedostoja, jotka tallennetaan laitteeseesi. Käytämme niitä parantaaksemme sivuston toimintaa ja ymmärtääksemme, miten sivustoamme käytetään.",
            },
            {
              title:
                'Välttämättömät evästeet <span class="pm__badge">Aina päällä</span>',
              description:
                "Nämä evästeet ovat välttämättömiä sivuston toiminnalle. Ilman niitä sivusto ei toimi oikein.",
              linkedCategory: "necessary",
            },
            {
              title: "Analytiikkaevästeet",
              description:
                "Nämä evästeet auttavat meitä ymmärtämään, miten kävijät käyttävät sivustoamme. Tiedot ovat anonyymejä.",
              linkedCategory: "analytics",
            },
          ],
        },
      },
    },
  },
});
