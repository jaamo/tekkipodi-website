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
  },

  language: {
    default: "fi",
    translations: {
      fi: {
        consentModal: {
          title: "Evästeet",
          description:
            "Sivustolla käytetään vain sivuston toiminnalle välttämättömiä evästeitä.",
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
          ],
        },
      },
    },
  },
});
