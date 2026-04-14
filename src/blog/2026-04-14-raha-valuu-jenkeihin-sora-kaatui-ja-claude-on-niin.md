---
layout: "layouts/blog-post.njk"
title: "010 - Raha valuu jenkeihin, Sora kaatui ja Claude on niin vaarallinen ettei sitä voi julkaista"
description: "Tässä jaksossa puhutaan siitä, miten tekoälytyökalujen käyttö valuttaa rahaa suoraan Yhdysvaltoihin paikallisten palkkojen sijaan. Lisäksi käydään läpi OpenAI:n Sora-videomallin alasajo, algoritmien reguloinnin uudet tuulet ja Anthropicin uuden mallin erikoinen julkaisupäätös. Lopuksi heitetään ennuste tekoälyavusteisen koodin tietoturvasta ja pohditaan, kannattaak tekoälyn antaa suodattaa uutisia."
date: "2026-04-14"
spotify: "https://open.spotify.com/episode/4KVWXVVKOWJlk8oyPSfgGO?si=c6b7c817ccde42cc"
length: "23 min"
---

## Raha valuu jenkeihin

Yksi tämän jakson keskeisistä havainnoista on yksinkertainen ja vähän epämukava: tekoälytyökalut siirtävät rahaa pois kotimaisesta taloudesta. Jos Claude Code korvaa kolmen tai viiden hengen tiimin, niin sen sijaan että maksettaisiin palkkoja ja sivukuluja ihmisille jotka käyvät lähikaupassa, maksetaan sata euroa kuussa suoraan jenkkiläiselle yhtiölle. Se sata euroa ei kierry kotimaisessa järjestelmässä. Se katoaa.

Analogiana toimii mainosraha, joka on jo pitkään valunut Googlelle, Metalle ja LinkedInille samalla kun kotimaiset mediatalot tuskailevat kannattavuutensa kanssa. Nyt sama ilmiö uhkaa laajentua ihan ihmistyöhön asti. Yksi mahdollinen suunnan korjaus voisi olla lokaalien mallien yleistyminen: kun tekoälyä ajetaan omalla koneella, ei palvelumaksuja valuisi minnekään.

## OpenAI ajoi Soran alas

OpenAI sulki Sora-videogenerointimallinsa varsin pian julkaisun jälkeen. Virallisena selityksenä oli kalleus, ja kallista se varmasti olikin — videoiden generoiminen on laskennallisesti aivan eri mittaluokkaa kuin tekstin tuottaminen. Uutisissa mainittiin myös tekijänoikeushuolet, mutta tämä selitys tuntuu hivenen ontolta ottaen huomioon OpenAI:n aikaisemmat otteet tekijänoikeusasioissa.

Todennäköisempi selitys löytyy siitä, että lopputulos ei yksinkertaisesti ollut riittävän hyvä. Videogenerointi, joka perustuu pikselien ennustamiseen eikä fyysisen maailman ymmärtämiseen, tuottaa videoita joissa kädet voivat mennä pöydän läpi ihan sujuvasti. Oikea harppaus videolaadun suhteen vaatisi niin sanottuja maailmamalleja — sellaisia joita muun muassa Jan LeCun on lähtenyt kehittämään. Niin kauan kun se pohja puuttuu, rahaa voi kaataa loputtomasti eikä tulos parane riittävästi.

## Algoritmit reguloinnin kohteeksi

Instagram on kertonut tuovansa käyttäjille työkaluja oman algoritmin hallintaan. Spotify ilmoitti vastaavasta suosittelualgoritmin säätömahdollisuudesta. X on puhunut oman suosittelualgoritminsä julkaisemisesta. Sattumaa? Tuskin. Los Angelesissa päättyi hiljattain oikeudenkäynti, jossa Meta ja YouTube tuomittiin maksamaan kuusi miljoonaa dollaria naiselle joka haastoi yhtiöt lapsuudenaikaisesta sosiaalisen median riippuvuudesta. Vastaavia oikeudenkäyntejä on käynnissä satoja, ja megakorporaatiot ovat selvästi alkaneet ennakoida tulevaa.

On mielenkiintoista katsoa taaksepäin: some alkoi täysin kronologisena, muuttui sitten algoritmipohjaiseksi — osittain siksi että algoritmiseen syötteeseen on helpompi myydä mainoksia — ja on nyt ehkä ottamassa askelta takaisin käyttäjän kontrollin suuntaan. YouTubessa tilaajien kronologinen lista on ollut hyvä ratkaisu: ensin katsotaan mitä seuratut kanavat ovat julkaisseet, sitten tarkistetaan mitä algoritmi suosittelee. Nyt sekin lista alkaa täyttyä algoritmisesta logiiikasta, mikä tuntuu viimeisen linnakkeen menettämiseltä.

## Antropicin uusi malli on niin vaarallinen, ettei sitä voi julkaista

Anthropic on ilmoittanut, ettei julkaise uusinta malliaan, koska se on liian hyvä — se löytää tietoturva-aukkoja vanhoista ohjelmistoista niin tehokkaasti, että julkaisu olisi vaarallista. Tämä herättää kaksi reaktiota.

Ensinnäkin: tämä haiskahtaa markkinoinnilta. Sam Altmankin on vuosia vihjaillut malleista jotka ovat niin hyviä, ettei ihmiskunta ole vielä valmis niihin. Nyt Anthropic tekee saman. Kun vihjaillaan vaarallisesta tuotteesta jota et voi saada, kiinnostus kasvaa — ja jos haluaa päästä käsiksi, pitää laittaa rahaa pöytään. Toinen tekijä on se, että Anthropic pelkää ilmeisesti kiinalaisten yhtiöiden tislaavan mallista sen osaamisen itselleen heti julkaisun jälkeen, joten julkaisu halutaan tehdä hallitusti pienemmissä paloissa.

Historiallinen vertauskohta löytyy Applelta: Power Mac G5 oli aikanaan niin tehokas, että sen vienti Yhdysvalloista kiellettiin turvallisuussyistä. Apple otti sen välittömästi markkinointivälineekseen. Kun näki Anthropicin tiedotteen, muisto välähti mieleen.

## Oraakkeli puhuu ja lukee itse uutisensa

Lopuksi heitetään ennuste: tänä vuonna tullaan näkemään joku massiivinen tietovuoto sovelluksesta joka on tehty tekoälyavusteisesti. Vauhtisokeus on tällä hetkellä kova — sovelluksia rakennetaan nopeasti, käyttäjiä tulee, mutta tietoturva jää helposti kakkoseksi. Kirjatkaa ruutuvihkoihin, katsotaan miten käy.

Viimeinen pohdinta koskee uutisten lukemista. Sosiaalisessa mediassa on paljon innostusta siitä, miten tekoälyllä voi rakentaa oman uutisagentin joka kerää, tiivistää ja suodattaa päivän uutiset. Idea on siisti. Mutta siinä on yksi ideologinen ongelma: haluaako antaa tekoälylle päätösvallan siitä, mikä on tärkeää? Uutisten arvo piilee usein siinä, miten eri lähteistä poimitut yksittäiset jutut yhdistyvät isommaksi kuvaksi vasta myöhemmin. Ja yhtä tärkeää on se, mitä ei sanota — kaksi uutista vierekkäin voi paljastaa jotain olennaista juuri sillä välissä olevalla hiljaisuudella. Tämä podcast on siis edelleen aivojen läpi suodatettua, ei tekoälyn.
