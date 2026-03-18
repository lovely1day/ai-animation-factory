import type { EraCatalogItem } from "../../types/character-room.types";

export const ERA_CATALOG: readonly EraCatalogItem[] = [
  // ═══════════════════════════════════════════════════════════
  // GROUP 1 — PREHISTORIC (4 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_CRETACEOUS",
    visual: {
      label: { ar: "طباشيري — ديناصورات", en: "Cretaceous — Dinosaurs" },
      thumbnail: "/thumbnails/eras/era-cretaceous.jpg",
    },
    yearRange: "145–66 مليون سنة",
    clothing: {
      promptF: "primitive dinosaur leather wraps, crude bone accessories, rawhide skirt, tribal markings painted on skin",
      promptM: "primitive dinosaur leather loincloth, bone necklace, crude fur cape, tribal face paint, leather arm bands",
    },
    environment: {
      architecture: "dense tropical forests, towering ancient trees, giant ferns, volcanic landscapes",
      streets: "muddy jungle paths, volcanic ash trails, prehistoric wetlands",
      transport: ["on foot", "riding dinosaur"],
      lighting: "harsh tropical sun filtering through canopy, volcanic glow",
      colorPalette: "deep greens, volcanic browns, golden sunlight, mossy teals",
    },
    ai: { prompt: "cretaceous prehistoric era, dinosaurs roaming, primeval jungle, ancient earth" },
  },
  {
    code: "ERA_ICE_AGE",
    visual: {
      label: { ar: "العصر الجليدي", en: "Ice Age" },
      thumbnail: "/thumbnails/eras/era-ice-age.jpg",
    },
    yearRange: "2.5 مليون – 11,700 سنة",
    clothing: {
      promptF: "heavy mammoth fur coat, fur-lined boots, bone jewelry, leather wrappings, animal pelt dress",
      promptM: "thick mammoth fur cloak, fur trousers, leather boots with bone toggles, bone weapons belt",
    },
    environment: {
      architecture: "ice caves, mammoth bone huts, frozen tundra shelters",
      streets: "snow-covered paths, frozen rivers, glacial plains",
      transport: ["on foot", "dogsled"],
      lighting: "pale arctic sun, blue-white ice reflections, aurora borealis",
      colorPalette: "ice blue, snow white, fur brown, pale gray, aurora green",
    },
    ai: { prompt: "ice age frozen tundra, mammoths, primitive humans, glaciers, snow-covered landscapes" },
  },
  {
    code: "ERA_PREHISTORIC",
    visual: {
      label: { ar: "ما قبل التاريخ — إنسان مبكر", en: "Prehistoric — Early Human" },
      thumbnail: "/thumbnails/eras/era-prehistoric.jpg",
    },
    yearRange: "300,000–10,000 ق.م",
    clothing: {
      promptF: "animal hide dress, bone beads necklace, leather sandals, primitive shell jewelry, ochre body paint",
      promptM: "animal skin loincloth, fur shoulder wrap, leather foot wrappings, bone arm bands, stone tools belt",
    },
    environment: {
      architecture: "cave dwellings, rock shelters, open plains campsites",
      streets: "dirt paths through grasslands, riverbanks, rocky terrain",
      transport: ["on foot"],
      lighting: "warm firelight, natural daylight, sunset over plains",
      colorPalette: "ochre red, earth brown, bone white, sunset orange, grass gold",
    },
    ai: { prompt: "prehistoric stone age, cave paintings, primitive tools, ancient humans, fire camps" },
  },
  {
    code: "ERA_ATLANTIS",
    visual: {
      label: { ar: "أطلنطس — أسطوري", en: "Atlantis — Mythical" },
      thumbnail: "/thumbnails/eras/era-atlantis.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "flowing silk gown with rare metal threads, crystal jewelry, seashell ornaments, iridescent fabric",
      promptM: "silk tunic with precious metal embroidery, crystal crown, ornate arm bands, flowing ceremonial robe",
    },
    environment: {
      architecture: "crystal spires, underwater glass domes, golden temples, floating islands",
      streets: "luminous crystal pathways, water canals, gravity-defying bridges",
      transport: ["crystal ship", "flying vessel"],
      lighting: "bioluminescent glow, crystal reflections, ethereal underwater light",
      colorPalette: "crystal blue, pearl white, gold shimmer, aqua green, coral pink",
    },
    ai: { prompt: "lost city of Atlantis, crystal architecture, underwater civilization, mythical advanced technology" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 2 — ANCIENT NEAR EAST (4 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_SUMERIAN",
    visual: {
      label: { ar: "سومري", en: "Sumerian" },
      thumbnail: "/thumbnails/eras/era-sumerian.jpg",
    },
    yearRange: "3500–2000 ق.م",
    clothing: {
      promptF: "kaunakes wool skirt, embroidered shawl, massive gold hoop earrings, beaded necklaces, bare feet or simple sandals",
      promptM: "kaunakes wool skirt, fringed shawl, turban with metal ornament, leather sandals, bronze dagger",
    },
    environment: {
      architecture: "mud brick ziggurats, reed houses, temple complexes, canals",
      streets: "narrow mud brick alleys, canal-side paths, market squares",
      transport: ["on foot", "donkey", "reed boat"],
      lighting: "harsh desert sun, warm lantern light, sunset over ziggurat",
      colorPalette: "mud brick tan, lapis blue, wool white, gold, reed green",
    },
    ai: { prompt: "ancient Sumer, ziggurats, cuneiform tablets, Mesopotamian civilization, Tigris Euphrates valley" },
  },
  {
    code: "ERA_BABYLONIAN",
    visual: {
      label: { ar: "بابلي", en: "Babylonian" },
      thumbnail: "/thumbnails/eras/era-babylonian.jpg",
    },
    yearRange: "2000–539 ق.م",
    clothing: {
      promptF: "blue and gold embroidered gown, fringed shawl, jeweled hair ornaments, pointed shoes, gold bracelets",
      promptM: "colorful embroidered robe with gold trim, pointed shoes, elaborate turban, jeweled belt, fringed cloak",
    },
    environment: {
      architecture: "Ishtar Gate, Hanging Gardens, blue-glazed brick palaces, temples",
      streets: "processional way, market streets, canals lined with palms",
      transport: ["on foot", "chariot", "river boat"],
      lighting: "golden sunset over city, torchlit processions, blue tile reflections",
      colorPalette: "lapis blue, gold, brick red, palm green, ivory white",
    },
    ai: { prompt: "ancient Babylon, Ishtar Gate, Hanging Gardens, Mesopotamian empire, cuneiform culture" },
  },
  {
    code: "ERA_ASSYRIAN",
    visual: {
      label: { ar: "آشوري", en: "Assyrian" },
      thumbnail: "/thumbnails/eras/era-assyrian.jpg",
    },
    yearRange: "900–600 ق.م",
    clothing: {
      promptF: "royal embroidered robe, elaborate jewelry with gemstones, fringed shawl, decorative hair pieces, gold sandals",
      promptM: "royal embroidered tunic with patterns, scale armor vest, ornate cloak, feathered cap, sword at belt",
    },
    environment: {
      architecture: "winged bull statues, relief-carved palaces, fortified citadels, lion hunts depicted",
      streets: "cobblestone streets, palace courtyards, guarded gates",
      transport: ["on foot", "war chariot", "horseback"],
      lighting: "dramatic shadows on reliefs, torchlit halls, harsh desert sun",
      colorPalette: "stone gray, royal purple, gold, crimson red, bronze",
    },
    ai: { prompt: "Assyrian Empire, winged bulls, Nineveh, ancient Near East warriors, palace reliefs" },
  },
  {
    code: "ERA_PERSIAN",
    visual: {
      label: { ar: "فارسي أخميني", en: "Achaemenid Persian" },
      thumbnail: "/thumbnails/eras/era-persian.jpg",
    },
    yearRange: "550–330 ق.م",
    clothing: {
      promptF: "silk robe with intricate patterns, elaborate jewelry, decorative belt, soft leather slippers, embroidered veil",
      promptM: "silk tunic with embroidery, ornate trousers, Phrygian cap, decorative cloak, leather boots with buckles",
    },
    environment: {
      architecture: "Persepolis columns, grand staircases, apadana palace, stone reliefs",
      streets: "processional ways, royal road, gardens with water channels",
      transport: ["horseback", "chariot", "on foot", "palanquin"],
      lighting: "golden hour on stone, torchlit ceremonies, bright Persian sun",
      colorPalette: "royal purple, gold, lapis blue, terracotta, emerald green",
    },
    ai: { prompt: "ancient Persia, Persepolis, Achaemenid Empire, Persian immortals, royal gardens" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 3 — ANCIENT EGYPT (2 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_EGYPT_OLD",
    visual: {
      label: { ar: "الدولة القديمة — أهرامات", en: "Old Kingdom — Pyramids" },
      thumbnail: "/thumbnails/eras/era-egypt-old.jpg",
    },
    yearRange: "2686–2181 ق.م",
    clothing: {
      promptF: "tight white linen sheath dress, Nefertiti-style collar necklace, kohl eyeliner, black wig with gold bands",
      promptM: "white linen shendyt kilt, golden sandals, nemes headdress with stripes, pharaoh's crook and flail",
    },
    environment: {
      architecture: "Great Pyramids of Giza, Sphinx, mastaba tombs, step pyramids, temples of Ra",
      streets: "dusty desert paths, Nile riverbanks, palm-lined avenues",
      transport: ["river barge", "war chariot", "on foot", "palanquin"],
      lighting: "harsh desert sun, golden sunset on pyramids, torchlit tomb interiors",
      colorPalette: "sand gold, lapis blue, linen white, ochre red, turquoise",
    },
    ai: { prompt: "ancient Egypt Old Kingdom, pyramids of Giza, pharaohs, Sphinx, Nile civilization" },
  },
  {
    code: "ERA_EGYPT_NEW",
    visual: {
      label: { ar: "الدولة الحديثة — رمسيس", en: "New Kingdom — Ramesses" },
      thumbnail: "/thumbnails/eras/era-egypt-new.jpg",
    },
    yearRange: "1550–1070 ق.م",
    clothing: {
      promptF: "pleated linen gown with gold trim, elaborate collar necklace, ornate wig with cones, gold bracelets, sandals",
      promptM: "elaborate shendyt with pleats, ornate pectoral, striped nemes or crown, decorative sandals, ceremonial staff",
    },
    environment: {
      architecture: "Karnak Temple, Luxor Temple, Valley of the Kings, Abu Simbel, obelisks",
      streets: "temple processional ways, Thebes streets, Nile harbor",
      transport: ["royal barge", "war chariot", "on foot", "litter"],
      lighting: "dramatic temple shadows, golden sunset, torch-lit ceremonies",
      colorPalette: "gold, lapis blue, carnelian red, turquoise, linen white",
    },
    ai: { prompt: "New Kingdom Egypt, Karnak, Luxor, Valley of Kings, Tutankhamun era, Rameses temples" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 4 — MEDITERRANEAN + ASIA (8 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_ANCIENT_GREEK",
    visual: {
      label: { ar: "يوناني قديم", en: "Ancient Greek" },
      thumbnail: "/thumbnails/eras/era-ancient-greek.jpg",
    },
    yearRange: "800–146 ق.م",
    clothing: {
      promptF: "white linen chiton with elegant draping, himation cloak, golden fibula, sandals, flowing hair or veil",
      promptM: "white himation draped over shoulder, chiton underneath, leather sandals, laurel wreath crown, clean beard",
    },
    environment: {
      architecture: "white marble temples, Parthenon, agora marketplace, columns with capitals, amphitheater",
      streets: "cobblestone agora, marble steps, olive tree-lined paths",
      transport: ["trireme", "horse", "on foot", "cart"],
      lighting: "bright Mediterranean sun, white marble reflections, golden afternoon",
      colorPalette: "marble white, Aegean blue, olive green, terracotta, gold",
    },
    ai: { prompt: "ancient Greece, Athens, Parthenon, classical antiquity, Greek temples, Mediterranean" },
  },
  {
    code: "ERA_ROMAN_REPUBLIC",
    visual: {
      label: { ar: "جمهورية رومانية", en: "Roman Republic" },
      thumbnail: "/thumbnails/eras/era-roman-republic.jpg",
    },
    yearRange: "509–27 ق.م",
    clothing: {
      promptF: "stola dress with palla shawl, elegant jewelry, sandals, elaborate hairstyle with pins",
      promptM: "white toga virilis over tunic, leather sandals, simple citizen's attire, short haircut",
    },
    environment: {
      architecture: "Forum Romanum, Senate house, aqueducts, basilicas, brick temples",
      streets: "cobblestone Roman roads, forum plaza, triumphal arches",
      transport: ["on foot", "horse", "litter", "cart"],
      lighting: "Mediterranean sun, warm evening light, torch-lit forums",
      colorPalette: "terra cotta, marble white, senatorial purple, bronze, ochre",
    },
    ai: { prompt: "Roman Republic, Forum Romanum, ancient Rome, toga-clad citizens, classical Rome" },
  },
  {
    code: "ERA_ROMAN_EMPIRE",
    visual: {
      label: { ar: "إمبراطورية رومانية", en: "Roman Empire" },
      thumbnail: "/thumbnails/eras/era-roman-empire.jpg",
    },
    yearRange: "27 ق.م – 476 م",
    clothing: {
      promptF: "silk stola with embroidered border, jeweled palla, elaborate curled hairstyle, gold jewelry, decorative sandals",
      promptM: "purple toga praetexta with gold embroidery, imperial laurel crown, ornate tunic, jeweled belt, fine sandals",
    },
    environment: {
      architecture: "Colosseum, Pantheon, imperial palaces, triumphal columns, grand forums",
      streets: "paved Roman roads, marble-paved forums, aqueduct-lined streets",
      transport: ["horseback", "chariot", "litter", "imperial carriage"],
      lighting: "golden imperial splendor, dramatic Colosseum shadows, torch-lit triumphs",
      colorPalette: "imperial purple, gold, marble white, crimson, bronze",
    },
    ai: { prompt: "Roman Empire, Colosseum, imperial Rome, gladiators, Caesars, ancient grandeur" },
  },
  {
    code: "ERA_BYZANTINE",
    visual: {
      label: { ar: "بيزنطي", en: "Byzantine" },
      thumbnail: "/thumbnails/eras/era-byzantine.jpg",
    },
    yearRange: "330–1453 م",
    clothing: {
      promptF: "silk dalmatica with gold embroidery, jeweled collar, elaborate headdress, gem-studded belt, embroidered shoes",
      promptM: "imperial chlamys cloak with tablion, jeweled loros, crown, ornate silk tunic, ceremonial boots",
    },
    environment: {
      architecture: "Hagia Sophia, golden mosaics, domed churches, fortified walls, imperial palace",
      streets: "marble-paved Constantinople streets, markets with silk, port of Golden Horn",
      transport: ["horseback", "ship", "litter", "chariot"],
      lighting: "golden mosaic glow, candlelit churches, Bosphorus reflections",
      colorPalette: "imperial purple, gold mosaic, deep blue, vermillion, emerald",
    },
    ai: { prompt: "Byzantine Empire, Constantinople, Hagia Sophia, Eastern Roman, golden mosaics, Orthodox" },
  },
  {
    code: "ERA_ANCIENT_CHINA",
    visual: {
      label: { ar: "الصين القديمة — هان", en: "Ancient China — Han" },
      thumbnail: "/thumbnails/eras/era-ancient-china.jpg",
    },
    yearRange: "221 ق.م – 220 م",
    clothing: {
      promptF: "flowing silk ruqun dress, wide sleeves, elaborate hairpins, jade jewelry, embroidered shoes",
      promptM: "shenyi robe with wide sleeves, jade belt ornament, scholar's cap, hemp or silk footwear",
    },
    environment: {
      architecture: "Great Wall sections, Han palaces, pagodas, traditional courtyards",
      streets: "dirt roads, imperial way, market streets with silk merchants",
      transport: ["horseback", "cart", "walking", "palanquin"],
      lighting: "soft morning mist, lantern glow, golden sunset on Great Wall",
      colorPalette: "imperial yellow, vermillion red, jade green, black, gold",
    },
    ai: { prompt: "Han Dynasty China, Great Wall, ancient Chinese civilization, silk road origins, terracotta warriors" },
  },
  {
    code: "ERA_TANG_DYNASTY",
    visual: {
      label: { ar: "عهد تانغ", en: "Tang Dynasty" },
      thumbnail: "/thumbnails/eras/era-tang-dynasty.jpg",
    },
    yearRange: "618–907 م",
    clothing: {
      promptF: "multi-colored silk ruqun with wide flowing sleeves, elaborate high hairstyle with ornaments, gold jewelry, silk shoes",
      promptM: "round-collar silk robe with dragon patterns, jade belt, official's hat, leather boots",
    },
    environment: {
      architecture: "Chang'an palaces, Buddhist temples, pagodas, garden pavilions",
      streets: "bustling Chang'an avenues, silk road markets, willow-lined canals",
      transport: ["horseback", "carriage", "boat", "walking"],
      lighting: "soft lantern light, golden palace glow, morning mist over gardens",
      colorPalette: "Tang gold, vermillion, azure blue, jade green, purple",
    },
    ai: { prompt: "Tang Dynasty golden age, Chang'an, cosmopolitan China, poetry and art, silk road prosperity" },
  },
  {
    code: "ERA_MING_DYNASTY",
    visual: {
      label: { ar: "عهد مينغ", en: "Ming Dynasty" },
      thumbnail: "/thumbnails/eras/era-ming-dynasty.jpg",
    },
    yearRange: "1368–1644 م",
    clothing: {
      promptF: "elegant ao jacket and skirt, mandarin collar, phoenix hair ornaments, jade accessories, lotus shoes",
      promptM: "flying fish or python robe with round collar, official's winged hat, jade belt, black boots",
    },
    environment: {
      architecture: "Forbidden City, Temple of Heaven, Ming Great Wall, classical gardens",
      streets: "Beijing hutongs, imperial processional ways, canal streets",
      transport: ["sedan chair", "horseback", "cart", "boat"],
      lighting: "red lantern glow, golden roof tiles, morning palace mist",
      colorPalette: "imperial yellow, vermillion, cobalt blue, jade green, gold",
    },
    ai: { prompt: "Ming Dynasty, Forbidden City, porcelain arts, Great Wall expansion, traditional Chinese culture" },
  },
  {
    code: "ERA_FEUDAL_JAPAN",
    visual: {
      label: { ar: "ياباني إقطاعي — ساموراي", en: "Feudal Japan — Samurai" },
      thumbnail: "/thumbnails/eras/era-feudal-japan.jpg",
    },
    yearRange: "1185–1603 م",
    clothing: {
      promptF: "silk kimono with elaborate patterns, white face makeup, ornate hair with kanzashi pins, zori sandals, obi sash",
      promptM: "complete samurai armor dou-maru, kabuto helmet with crest, hakama trousers, katana swords, war fan",
    },
    environment: {
      architecture: "Japanese castles with white walls, Buddhist temples, Zen gardens, samurai residences",
      streets: "castle town streets, wooden bridges, cherry blossom paths",
      transport: ["horseback", "walking", "palanquin", "boat"],
      lighting: "cherry blossom filtered light, paper lantern glow, golden sunset on castle",
      colorPalette: "samurai black, vermillion, sakura pink, gold, indigo",
    },
    ai: { prompt: "feudal Japan, samurai warriors, Japanese castles, Edo period culture, bushido, cherry blossoms" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 5 — INDIA + MONGOL + AMERICAS (5 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_ANCIENT_INDIA",
    visual: {
      label: { ar: "هند قديمة — موريا", en: "Ancient India — Maurya" },
      thumbnail: "/thumbnails/eras/era-ancient-india.jpg",
    },
    yearRange: "322 ق.م – 550 م",
    clothing: {
      promptF: "silk sari with gold embroidery, heavy gold jewelry, bindi on forehead, henna on hands, ornate nose ring",
      promptM: "dhoti with decorative border, uttariya shoulder cloth, turban with jewel, leather sandals, warrior's arm bands",
    },
    environment: {
      architecture: "stupas with carvings, rock-cut temples, Ashoka pillars, palaces",
      streets: "bustling market streets, river ghats, elephant processions",
      transport: ["elephant", "horse", "cart", "walking"],
      lighting: "tropical golden sun, temple lamp glow, sunset over Ganges",
      colorPalette: "saffron orange, gold, deep red, ivory, indigo",
    },
    ai: { prompt: "ancient India, Maurya Empire, Ashoka, Buddhist stupas, Indian subcontinent, Ganges civilization" },
  },
  {
    code: "ERA_MONGOL",
    visual: {
      label: { ar: "إمبراطورية المغول", en: "Mongol Empire" },
      thumbnail: "/thumbnails/eras/era-mongol.jpg",
    },
    yearRange: "1206–1368 م",
    clothing: {
      promptF: "deel robe of silk or wool, fur-lined, leather boots, ornate headdress with silver, heavy jewelry",
      promptM: "deel robe with wide belt, fur and leather layers, metal helmet, bow case and quiver, riding boots",
    },
    environment: {
      architecture: "yurts in vast camps, simple wooden palaces, steppe landscapes",
      streets: "open steppe, camp circles, Silk Road outposts",
      transport: ["horse", "camel", "cart", "walking"],
      lighting: "vast steppe sky, golden sunrise, campfire glow under stars",
      colorPalette: "steppe green, sky blue, earth brown, silver, red",
    },
    ai: { prompt: "Mongol Empire, Genghis Khan, steppe warriors, yurts, Silk Road, nomadic culture, vast plains" },
  },
  {
    code: "ERA_MAYAN",
    visual: {
      label: { ar: "مايا الكلاسيكي", en: "Classic Maya" },
      thumbnail: "/thumbnails/eras/era-mayan.jpg",
    },
    yearRange: "250–900 م",
    clothing: {
      promptF: "cotton huipil with vibrant colors, jade jewelry, elaborate headdress with quetzal feathers, body paint",
      promptM: "cotton loincloth and cape, quetzal feather headdress, jade ornaments, body paint, shell jewelry",
    },
    environment: {
      architecture: "step pyramids, ball courts, carved stelae, jungle temples",
      streets: "jungle paths, raised causeways, ceremonial plazas",
      transport: ["on foot", "canoe"],
      lighting: "jungle dappled light, temple shadow, tropical sun",
      colorPalette: "jungle green, jade, quetzal blue, red ochre, gold",
    },
    ai: { prompt: "Maya civilization, Chichen Itza, Tikal, Mesoamerican pyramids, jungle temples, ancient calendar" },
  },
  {
    code: "ERA_AZTEC",
    visual: {
      label: { ar: "أزتيك", en: "Aztec" },
      thumbnail: "/thumbnails/eras/era-aztec.jpg",
    },
    yearRange: "1300–1521 م",
    clothing: {
      promptF: "woven cotton huipil with embroidery, feathered headdress, shell and jade jewelry, body paint, sandals",
      promptM: "maxtlatl loincloth with embroidered cloak, warrior feather headdress, god mask, cotton armor, macuahuitl weapon",
    },
    environment: {
      architecture: "Tenochtitlan pyramids, Templo Mayor, floating gardens, causeways",
      streets: "canal streets of Tenochtitlan, market plazas, sacred precinct",
      transport: ["canoe", "walking"],
      lighting: "tropical highland sun, sacred fire glow, dawn over pyramids",
      colorPalette: "feather green, turquoise, obsidian black, gold, blood red",
    },
    ai: { prompt: "Aztec Empire, Tenochtitlan, Mesoamerican civilization, warrior culture, floating city, temples" },
  },
  {
    code: "ERA_INCA",
    visual: {
      label: { ar: "إنكا", en: "Inca" },
      thumbnail: "/thumbnails/eras/era-inca.jpg",
    },
    yearRange: "1438–1533 م",
    clothing: {
      promptF: "anaku dress with lliclla shawl, chumpi belt, tocapu patterns, shell jewelry, sandals",
      promptM: "uncu tunic with geometric patterns, chullu cap, chumpi belt, leather sandals, quipu carrier",
    },
    environment: {
      architecture: "Machu Picchu, Sacsayhuaman walls, Inca road system, terraced mountains",
      streets: "stone paved Inca roads, mountain trails, Cusco plazas",
      transport: ["llama", "on foot", "litter"],
      lighting: "high altitude Andean sun, golden hour on mountains, crisp mountain air",
      colorPalette: "Andean terracotta, gold, llama wool colors, mountain green, sky blue",
    },
    ai: { prompt: "Inca Empire, Machu Picchu, Andes mountains, Cusco, stone masonry, terrace farming, llama caravans" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 6 — ISLAMIC CIVILIZATION + MEDIEVAL EUROPE (9 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_EARLY_ISLAM",
    visual: {
      label: { ar: "صدر الإسلام", en: "Early Islam" },
      thumbnail: "/thumbnails/eras/era-early-islam.jpg",
    },
    yearRange: "610–750 م",
    clothing: {
      promptF: "simple embroidered abaya, headscarf, leather sandals, minimal jewelry, modest loose clothing",
      promptM: "simple white thobe, black bisht cloak, leather sandals, simple turban, modest attire",
    },
    environment: {
      architecture: "simple mosques, mud brick houses, oasis settlements, early Kaaba",
      streets: "dusty Arabian streets, oasis paths, trade caravan routes",
      transport: ["camel", "horse", "walking"],
      lighting: "desert sun, warm firelight, moonlit oases",
      colorPalette: "desert sand, white, black, ochre, date palm green",
    },
    ai: { prompt: "early Islamic era, Arabian Peninsula, Prophet Muhammad era, Mecca Medina, desert civilization" },
  },
  {
    code: "ERA_ISLAMIC_GOLDEN",
    visual: {
      label: { ar: "العصر الذهبي الإسلامي", en: "Islamic Golden Age" },
      thumbnail: "/thumbnails/eras/era-islamic-golden.jpg",
    },
    yearRange: "750–1258 م",
    clothing: {
      promptF: "colorful silk abaya with embroidery, jeweled headpiece, silver jewelry, leather slippers, patterned fabrics",
      promptM: "flowing silk robe with embroidery, elaborate turban with ornament, leather slippers, silver belt, perfume",
    },
    environment: {
      architecture: "grand mosques with minarets, palaces with courtyards, libraries, observatories, gardens",
      streets: "bustling bazaar streets, covered souks, canal-side Baghdad, Cordoba streets",
      transport: ["horse", "camel", "cart", "walking"],
      lighting: "golden mosque interiors, lantern-lit bazaars, moonlit courtyards",
      colorPalette: "Islamic green, lapis blue, gold, white, Persian turquoise",
    },
    ai: { prompt: "Islamic Golden Age, Baghdad, Cordoba, House of Wisdom, scientific revolution, medieval Islam" },
  },
  {
    code: "ERA_OTTOMAN",
    visual: {
      label: { ar: "عثماني", en: "Ottoman" },
      thumbnail: "/thumbnails/eras/era-ottoman.jpg",
    },
    yearRange: "1299–1922 م",
    clothing: {
      promptF: "elaborate kaftan with embroidery, colorful head covering, jeweled belt, harem slippers, pearl jewelry",
      promptM: "sultan's caftan with gold embroidery, turban with jeweled aigrette, dagger at belt, leather boots, robes",
    },
    environment: {
      architecture: "Blue Mosque, Topkapi Palace, Hagia Sophia converted, bazaars, Turkish baths",
      streets: "Grand Bazaar alleys, Istanbul streets with minarets, Bosporus waterfront",
      transport: ["horse", "boat", "carriage", "walking"],
      lighting: "golden mosque interiors, Bosporus sunset, lantern-lit bazaars",
      colorPalette: "Ottoman red, gold, turquoise, emerald, ivory",
    },
    ai: { prompt: "Ottoman Empire, Istanbul Constantinople, sultans, Turkish culture, Balkans, Middle East empire" },
  },
  {
    code: "ERA_ANDALUSIAN",
    visual: {
      label: { ar: "أندلسي", en: "Andalusian" },
      thumbnail: "/thumbnails/eras/era-andalusian.jpg",
    },
    yearRange: "711–1492 م",
    clothing: {
      promptF: "silk dress with Moorish patterns, decorative veil, gold jewelry, embroidered slippers, silk shawl",
      promptM: "silk jubba with embroidery, turban with jewel, ornate sash, leather boots, decorative dagger",
    },
    environment: {
      architecture: "Alhambra Palace, Mezquita of Cordoba, Generalife gardens, Alcazar",
      streets: "narrow winding alleys of Granada, courtyard fountains, orange tree plazas",
      transport: ["horse", "mule", "walking", "cart"],
      lighting: "golden Alhambra walls, courtyard shadows, sunset over Sierra Nevada",
      colorPalette: "Alhambra red, gold, lapis blue, ivory, emerald green",
    },
    ai: { prompt: "Al-Andalus, Moorish Spain, Alhambra, Cordoba caliphate, Islamic Spain, convivencia" },
  },
  {
    code: "ERA_DARK_AGES",
    visual: {
      label: { ar: "العصور المظلمة", en: "Dark Ages" },
      thumbnail: "/thumbnails/eras/era-dark-ages.jpg",
    },
    yearRange: "500–1000 م",
    clothing: {
      promptF: "simple wool dress with girdle, headscarf, wooden shoes, minimal jewelry, rough spun fabric",
      promptM: "rough wool tunic and trousers, simple belt, leather boots, fur cloak, basic head covering",
    },
    environment: {
      architecture: "wooden halls, stone churches, fortified villages, monasteries",
      streets: "mud paths, village lanes, forest clearings",
      transport: ["walking", "horse", "ox cart"],
      lighting: "dim firelight, gray northern skies, monastery candle glow",
      colorPalette: "earth brown, wool gray, forest green, rust, charcoal",
    },
    ai: { prompt: "Dark Ages early medieval, post-Roman Europe, Anglo-Saxon, Frankish kingdoms, monastery life" },
  },
  {
    code: "ERA_VIKING",
    visual: {
      label: { ar: "فايكنغ", en: "Viking" },
      thumbnail: "/thumbnails/eras/era-viking.jpg",
    },
    yearRange: "793–1066 م",
    clothing: {
      promptF: "wool apron dress with brooches, linen underdress, amber beads, leather boots, braided hair",
      promptM: "wool tunic and trousers, chainmail armor, horned or simple helmet, fur cloak, Viking sword, round shield",
    },
    environment: {
      architecture: "longhouses with carved posts, wooden stave churches, coastal villages",
      streets: "grassy paths between longhouses, fjord shores, market harbors",
      transport: ["longship", "horse", "walking"],
      lighting: "gray northern sky, firelight in longhouse, midnight sun or aurora",
      colorPalette: "fjord blue, wool natural, iron gray, rust red, fur brown",
    },
    ai: { prompt: "Viking Age, Norse warriors, longships, Scandinavia, runestones, saga culture, northern seas" },
  },
  {
    code: "ERA_HIGH_MEDIEVAL",
    visual: {
      label: { ar: "ذروة العصور الوسطى", en: "High Medieval" },
      thumbnail: "/thumbnails/eras/era-high-medieval.jpg",
    },
    yearRange: "1000–1300 م",
    clothing: {
      promptF: "elegant bliaut gown with tight sleeves, jeweled girdle, veil and wimple, leather shoes, embroidered details",
      promptM: "chainmail hauberk, surcoat with heraldry, simple helmet, sword and shield, leather boots",
    },
    environment: {
      architecture: "stone castles, Gothic cathedrals rising, walled towns, guild halls",
      streets: "cobblestone streets, market squares, castle courtyards",
      transport: ["horse", "cart", "walking"],
      lighting: "stained glass glow, torchlit halls, golden afternoon on stone",
      colorPalette: "heraldic colors, stone gray, stained glass jewel tones, iron",
    },
    ai: { prompt: "High Middle Ages, medieval castles, Gothic cathedrals, knights, feudalism, guilds" },
  },
  {
    code: "ERA_CRUSADES",
    visual: {
      label: { ar: "الحروب الصليبية", en: "The Crusades" },
      thumbnail: "/thumbnails/eras/era-crusades.jpg",
    },
    yearRange: "1096–1291 م",
    clothing: {
      promptF: "noble gown with heraldic embroidery, circlet, veil, jeweled belt, fine leather shoes",
      promptM: "full plate armor with cross insignia, great helm with crest, chainmail, sword, Crusader surcoat red or white",
    },
    environment: {
      architecture: "Crusader castles, Byzantine churches, Levantine cities, desert forts",
      streets: "Jerusalem streets, Acre harbor, caravan routes, siege camps",
      transport: ["warhorse", "ship", "walking", "cart"],
      lighting: "desert sun on armor, torchlit sieges, golden Levantine afternoon",
      colorPalette: "crusader red, white, iron gray, Levant gold, sand",
    },
    ai: { prompt: "Crusades, Holy Land, knights templar, medieval warfare, Jerusalem, Levant, religious war" },
  },
  {
    code: "ERA_LATE_MEDIEVAL",
    visual: {
      label: { ar: "أواخر العصور الوسطى", en: "Late Medieval" },
      thumbnail: "/thumbnails/eras/era-late-medieval.jpg",
    },
    yearRange: "1300–1500 م",
    clothing: {
      promptF: "sumptuous gown with dagged sleeves, elaborate headdress, jeweled necklace, velvet and fur, pointed shoes",
      promptM: "plate armor with fluting, elaborate helmet with feathers, heraldic surcoat, fine sword, riding boots",
    },
    environment: {
      architecture: "fully developed Gothic cathedrals, royal palaces, universities, town halls",
      streets: "bustling medieval towns, university quarters, bridge streets",
      transport: ["horse", "carriage", "ship", "walking"],
      lighting: "cathedral light through rose windows, torchlit feasts, winter gray",
      colorPalette: "royal purple, vermillion, gold, jet black, lapis",
    },
    ai: { prompt: "Late Middle Ages, Black Death era, Hundred Years War, medieval chivalry, Gothic peak" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 7 — RENAISSANCE TO MODERN (9 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_RENAISSANCE",
    visual: {
      label: { ar: "النهضة الأوروبية", en: "Renaissance" },
      thumbnail: "/thumbnails/eras/era-renaissance.jpg",
    },
    yearRange: "1300–1600 م",
    clothing: {
      promptF: "rich silk gown with slashed sleeves, jeweled bodice, elaborate headdress with pearls, velvet cloak, elegant shoes",
      promptM: "doublet and hose with slashed fabric, codpiece, feathered cap, sword, fur-lined cloak, leather boots",
    },
    environment: {
      architecture: "Italian palazzos, domed cathedrals, piazzas with statues, frescoed chapels",
      streets: "Florence streets, Venetian canals, Rome piazzas, artist quarters",
      transport: ["horse", "carriage", "gondola", "walking"],
      lighting: "golden Renaissance glow, candlelit chapels, Italian sun on marble",
      colorPalette: "Renaissance red, gold, ultramarine, ivory, bronze",
    },
    ai: { prompt: "Italian Renaissance, Florence, Medici, Leonardo da Vinci, Michelangelo, classical revival, humanism" },
  },
  {
    code: "ERA_EXPLORATION",
    visual: {
      label: { ar: "عصر الاستكشاف", en: "Age of Exploration" },
      thumbnail: "/thumbnails/eras/era-exploration.jpg",
    },
    yearRange: "1400–1600 م",
    clothing: {
      promptF: "Spanish farthingale gown with stiff bodice, ruff collar, jeweled headpiece, silk overskirt, chopine shoes",
      promptM: "padded doublet and trunk hose, ruff collar, feathered cap, sword, explorer's cloak, leather boots",
    },
    environment: {
      architecture: "Portuguese maritime buildings, Spanish colonial architecture, port warehouses",
      streets: "Lisbon harbor, Seville port, colonial settlements, shipyards",
      transport: ["caravel", "horse", "carriage", "walking"],
      lighting: "ocean sunset, tropical sun, lantern-lit ship decks",
      colorPalette: "ocean blue, gold doubloons, Spanish red, white sails, tropical green",
    },
    ai: { prompt: "Age of Discovery, Columbus, Magellan, Portuguese explorers, caravels, New World exploration" },
  },
  {
    code: "ERA_BAROQUE",
    visual: {
      label: { ar: "باروك", en: "Baroque" },
      thumbnail: "/thumbnails/eras/era-baroque.jpg",
    },
    yearRange: "1600–1750 م",
    clothing: {
      promptF: "elaborate silk gown with panniers, intricate lace, jeweled stomacher, towering powdered wig, feather fan",
      promptM: "brocade coat with gold braid, waistcoat, breeches, powdered wig with ribbon, sword, high heels",
    },
    environment: {
      architecture: "Versailles Palace, St. Peter's Basilica, opulent cathedrals, grand salons",
      streets: "Versailles Hall of Mirrors, Paris boulevards, Vienna palaces",
      transport: ["carriage", "horse", "sedan chair", "walking"],
      lighting: "dramatic chiaroscuro, candlelit opulence, golden reflections in mirrors",
      colorPalette: "royal purple, gold brocade, deep red, ivory, midnight blue",
    },
    ai: { prompt: "Baroque era, Versailles, Louis XIV, Rembrandt, Vivaldi, opulent art, dramatic grandeur" },
  },
  {
    code: "ERA_1700",
    visual: {
      label: { ar: "القرن الثامن عشر", en: "18th Century" },
      thumbnail: "/thumbnails/eras/era-1700.jpg",
    },
    yearRange: "1700–1799",
    clothing: {
      promptF: "rococo gown with wide panniers, delicate floral silk, lace engageantes, powdered high wig, painted fan",
      promptM: "frock coat with elaborate buttons, waistcoat, knee breeches, stockings, buckled shoes, tricorn hat, powdered wig",
    },
    environment: {
      architecture: "Georgian townhouses, Rococo palaces, assembly rooms, coffee houses",
      streets: "London streets, Paris boulevards, colonial Philadelphia",
      transport: ["carriage", "horse", "ship", "walking"],
      lighting: "soft candlelight, afternoon tea glow, gaslight beginning",
      colorPalette: "pastel pink, powder blue, ivory, gold, sage green",
    },
    ai: { prompt: "18th century, Georgian era, Rococo, Enlightenment, American colonies, elegant society" },
  },
  {
    code: "ERA_1800",
    visual: {
      label: { ar: "فيكتوري مبكر", en: "Early Victorian" },
      thumbnail: "/thumbnails/eras/era-1800.jpg",
    },
    yearRange: "1800–1849",
    clothing: {
      promptF: "high-waisted empire gown, light muslin or silk, short puffed sleeves, delicate embroidery, satin slippers",
      promptM: "tailcoat with high collar, waistcoat, cravat, tight breeches, top boots, beaver hat",
    },
    environment: {
      architecture: "Regency terraces, neoclassical villas, early industrial mills",
      streets: "London Regency streets, Bath crescents, country lanes",
      transport: ["carriage", "horse", "steam train beginning", "walking"],
      lighting: "morning fog over London, candlelit balls, afternoon promenades",
      colorPalette: "Regency blue, cream, soft yellow, forest green, white",
    },
    ai: { prompt: "Regency era, Jane Austen, Napoleon era, early Industrial Revolution, Georgian elegance" },
  },
  {
    code: "ERA_1850",
    visual: {
      label: { ar: "فيكتوري متأخر", en: "Late Victorian" },
      thumbnail: "/thumbnails/eras/era-1850.jpg",
    },
    yearRange: "1850–1899",
    clothing: {
      promptF: "crinoline gown with wide hoop skirt, tight corset bodice, pagoda sleeves, bonnet with veil, gloves",
      promptM: "frock coat with waist seam, waistcoat, cravat or tie, trousers, top hat, pocket watch, polished shoes",
    },
    environment: {
      architecture: "Victorian terraces, Gothic revival buildings, railway stations, factories",
      streets: "London fog, cobblestone streets, gas-lit avenues, steam trains",
      transport: ["steam train", "horse-drawn omnibus", "carriage", "walking"],
      lighting: "gaslight glow, foggy London streets, factory smoke, candlelit parlors",
      colorPalette: "burgundy, bottle green, black, gold, ivory",
    },
    ai: { prompt: "Victorian era, Industrial Revolution, Charles Dickens, steam age, British Empire, Queen Victoria" },
  },
  {
    code: "ERA_1900",
    visual: {
      label: { ar: "إدواردي", en: "Edwardian" },
      thumbnail: "/thumbnails/eras/era-1900.jpg",
    },
    yearRange: "1900–1919",
    clothing: {
      promptF: "S-bend corset gown with Gibson Girl silhouette, large hat with feathers, long gloves, parasol, elegant boots",
      promptM: "sack suit with soft shoulders, boater or derby hat, straw hat in summer, wing collar, pocket square",
    },
    environment: {
      architecture: "Edwardian terraces, grand hotels, early skyscrapers, department stores",
      streets: "electric-lit streets, motor cars appearing, fashionable promenades",
      transport: ["automobile", "electric tram", "steam train", "horse carriage"],
      lighting: "electric light beginning, softer than gas, afternoon tea gardens",
      colorPalette: "pastel lavender, ivory, navy, white, soft pink",
    },
    ai: { prompt: "Edwardian era, Titanic age, belle epoque, early automobiles, elegant society, pre-WWI" },
  },
  {
    code: "ERA_1920",
    visual: {
      label: { ar: "عشرينيات", en: "1920s — Roaring Twenties" },
      thumbnail: "/thumbnails/eras/era-1920.jpg",
    },
    yearRange: "1920–1929",
    clothing: {
      promptF: "flapper dress with dropped waist, beaded fringe, cloche hat, T-strap shoes, pearls, cigarette holder",
      promptM: "three-piece suit with wide lapels, fedora hat, two-tone shoes, pocket watch, suspenders",
    },
    environment: {
      architecture: "Art Deco skyscrapers, speakeasies, jazz clubs, grand cinemas",
      streets: "neon-lit city streets, jazz age nightlife, Model T traffic",
      transport: ["automobile", "train", "airplane early", "trolley"],
      lighting: "neon signs, jazz club spotlights, Art Deco glamour",
      colorPalette: "black, gold, silver, crimson, champagne",
    },
    ai: { prompt: "1920s, Jazz Age, Art Deco, flappers, Prohibition, Great Gatsby, Charlie Chaplin, early cinema" },
  },
  {
    code: "ERA_1930",
    visual: {
      label: { ar: "ثلاثينيات", en: "1930s — Great Depression" },
      thumbnail: "/thumbnails/eras/era-1930.jpg",
    },
    yearRange: "1930–1939",
    clothing: {
      promptF: "bias-cut evening gown, shoulder pads beginning, modest day dress, cloche hat evolving, sensible shoes",
      promptM: "wide-shouldered suit, fedora hat, double-breasted coat, Oxford bags trousers, polished shoes",
    },
    environment: {
      architecture: "Art Deco theaters, streamline moderne, Hoovervilles, emerging skyscrapers",
      streets: "bread lines, jazz clubs, speakeasies ending, motor traffic increasing",
      transport: ["automobile", "train", "zeppelin", "ocean liner"],
      lighting: "movie palace marquee lights, radio glow, dim apartment lighting",
      colorPalette: "depression gray, sepia, Art Deco teal, silver screen black and white",
    },
    ai: { prompt: "1930s Great Depression, Art Deco, jazz age ending, breadlines, Dust Bowl, rising fascism" },
  },
  {
    code: "ERA_1940",
    visual: {
      label: { ar: "أربعينيات — الحرب العالمية", en: "1940s — WWII Era" },
      thumbnail: "/thumbnails/eras/era-1940.jpg",
    },
    yearRange: "1940–1949",
    clothing: {
      promptF: "utility suit with padded shoulders, modest skirt, headscarf for factory work, stockings with seams, practical shoes",
      promptM: "military uniform, trench coat, fedora, civilian suit with rationed fabric, victory suit",
    },
    environment: {
      architecture: "bomb-damaged cities, military bases, factory buildings, air raid shelters",
      streets: "blackout curtains, propaganda posters, troop movements, ration queues",
      transport: ["military jeep", "train", "airplane", "ship"],
      lighting: "blackout darkness, searchlights, factory glow, candlelight",
      colorPalette: "olive drab, navy blue, khaki, air raid blue, victory red",
    },
    ai: { prompt: "World War II era, 1940s, home front, military uniforms, rationing, blackouts, victory gardens" },
  },
  {
    code: "ERA_1950",
    visual: {
      label: { ar: "خمسينيات", en: "1950s — Post-War" },
      thumbnail: "/thumbnails/eras/era-1950.jpg",
    },
    yearRange: "1950–1959",
    clothing: {
      promptF: "full skirt with petticoat, fitted bodice, pearls, cat-eye glasses, saddle shoes, perfect housewife look",
      promptM: "gray flannel suit, white shirt narrow tie, fedora or flat-top haircut, letterman jacket for teens",
    },
    environment: {
      architecture: "suburban ranch houses, drive-in theaters, diners with neon, shopping malls beginning",
      streets: "suburban cul-de-sacs, main street America, drive-in restaurants",
      transport: ["automobile classic 50s", "train", "airplane jet age beginning", "bus"],
      lighting: "neon diner glow, TV set illumination, suburban streetlights, nuclear age brightness",
      colorPalette: "turquoise, pink, mint green, chrome silver, atomic red",
    },
    ai: { prompt: "1950s suburban America, post-war boom, rock and roll, diners, drive-ins, classic cars, nuclear family" },
  },
  {
    code: "ERA_1960",
    visual: {
      label: { ar: "ستينيات", en: "1960s — Swinging Sixties" },
      thumbnail: "/thumbnails/eras/era-1960.jpg",
    },
    yearRange: "1960–1969",
    clothing: {
      promptF: "mini skirt, mod dress with geometric patterns, go-go boots, pillbox hat early or hippie flowing later, bold makeup",
      promptM: "mod suit narrow lapels, turtleneck, Nehru jacket, bell-bottoms late 60s, longer hair",
    },
    environment: {
      architecture: "modernist concrete, space-age buildings, communes, protest sites",
      streets: "London Carnaby Street, San Francisco Haight-Ashbury, protest marches, moon landing celebrations",
      transport: ["Volkswagen van", "muscle car", "commercial jet", "space rocket"],
      lighting: "psychedelic blacklight, TV moon landing, protest flares, disco beginning",
      colorPalette: "psychedelic rainbow, orange, hot pink, lime green, electric blue",
    },
    ai: { prompt: "1960s, swinging London, hippie culture, moon landing, civil rights, psychedelic, Vietnam war protests" },
  },
  {
    code: "ERA_1970",
    visual: {
      label: { ar: "سبعينيات", en: "1970s — Disco Era" },
      thumbnail: "/thumbnails/eras/era-1970.jpg",
    },
    yearRange: "1970–1979",
    clothing: {
      promptF: "bell-bottoms, halter top, platform shoes, polyester leisure suit, feathered hair, disco sparkle",
      promptM: "leisure suit polyester, wide lapels, platform shoes, bell-bottom jeans, long hair or afro, mustache",
    },
    environment: {
      architecture: "brutalist concrete, discotheques, suburban sprawl, gas station lines",
      streets: "disco clubs, roller rinks, protest aftermath, punk emerging late 70s",
      transport: ["muscle car gas guzzler", "VW beetle", "jumbo jet", "skateboard"],
      lighting: "disco ball sparkle, neon lights, oil crisis dimming, lava lamp glow",
      colorPalette: "harvest gold, avocado green, burnt orange, brown, disco purple",
    },
    ai: { prompt: "1970s disco era, bell bottoms, Studio 54, oil crisis, punk rock beginning, Watergate, retro 70s" },
  },
  {
    code: "ERA_1980",
    visual: {
      label: { ar: "ثمانينيات", en: "1980s — Neon Decade" },
      thumbnail: "/thumbnails/eras/era-1980.jpg",
    },
    yearRange: "1980–1989",
    clothing: {
      promptF: "power suit with shoulder pads, neon colors, leg warmers, big hair, spandex, punk or preppy styles",
      promptM: "power suit bold tie, Members Only jacket, acid wash jeans, mullet or big hair, high-top sneakers",
    },
    environment: {
      architecture: "glass office towers, malls at peak, arcades, Memphis design interiors",
      streets: "neon-lit city, Wall Street boom, shopping mall culture, arcade game rooms",
      transport: ["yuppie BMW", "DeLorean", "boombox on shoulder", "rollerblades"],
      lighting: "neon pink and blue, arcade screen glow, MTV aesthetic, fluorescent office",
      colorPalette: "neon pink, electric blue, Day-Glo orange, chrome black, purple",
    },
    ai: { prompt: "1980s neon decade, MTV generation, Wall Street yuppies, arcade games, big hair, retro 80s synth" },
  },
  {
    code: "ERA_1990",
    visual: {
      label: { ar: "تسعينيات", en: "1990s — Grunge & Tech" },
      thumbnail: "/thumbnails/eras/era-1990.jpg",
    },
    yearRange: "1990–1999",
    clothing: {
      promptF: "grunge flannel or minimal slip dress, choker necklace, Doc Martens, baggy jeans, crop top, heroin chic",
      promptM: "grunge flannel shirt, baggy jeans, oversized t-shirt, backwards cap, Doc Martens or sneakers",
    },
    environment: {
      architecture: "coffee shops, dot-com offices, converted lofts, grunge clubs",
      streets: "Seattle grunge scene, internet cafe, skate parks, rave culture",
      transport: ["SUV emerging", "skateboard", "internet connection", "beater car"],
      lighting: "computer monitor glow, club blacklight, coffee shop warm light, video game screen",
      colorPalette: "grunge brown, plaid red, neon yellow rave, cyber green, black",
    },
    ai: { prompt: "1990s grunge decade, Nirvana, dot-com boom, internet beginning, Friends TV show, retro 90s" },
  },
  {
    code: "ERA_2000",
    visual: {
      label: { ar: "ألفية جديدة", en: "2000s — Y2K Era" },
      thumbnail: "/thumbnails/eras/era-2000.jpg",
    },
    yearRange: "2000–2009",
    clothing: {
      promptF: "low-rise jeans, velour tracksuit, trucker hat, butterfly clips, frosted lip gloss, bedazzled everything",
      promptM: "baggy cargo pants, polo shirt with popped collar, trucker hat, velour tracksuit, frosted tips hair",
    },
    environment: {
      architecture: "McMansions, big box stores, early social media offices, post-9/11 security",
      streets: "suburban sprawl peak, mall culture declining, early social media, war on terror",
      transport: ["SUV dominance", "hybrid car beginning", "iPod earbuds", "flip phone"],
      lighting: "CRT monitor glow, early LCD, mall fluorescence, incandescent warmth",
      colorPalette: "metallic silver, pink velour, rhinestone sparkle, blue LED, chrome",
    },
    ai: { prompt: "2000s Y2K era, Britney Spears style, early internet, 9/11 aftermath, iPod culture, MySpace" },
  },
  {
    code: "ERA_2010",
    visual: {
      label: { ar: "عشرينيات القرن 21", en: "2010s — Social Media" },
      thumbnail: "/thumbnails/eras/era-2010.jpg",
    },
    yearRange: "2010–2019",
    clothing: {
      promptF: "skinny jeans, hipster style, normcore, athleisure emerging, Instagram fashion, vintage revival",
      promptM: "skinny jeans, flannel revival, beard culture, craft beer aesthetic, streetwear, sneaker culture",
    },
    environment: {
      architecture: "co-working spaces, artisanal coffee shops, Instagram-worthy interiors, smartphone ubiquity",
      streets: "food truck culture, bike lanes, selfie spots, protest movements, streaming entertainment",
      transport: ["Uber rideshare", "electric car", "bike share", "smartphone navigation"],
      lighting: "smartphone screen glow, LED everywhere, Instagram filter aesthetic, ring lights",
      colorPalette: "Millennial pink, rose gold, Instagram blue, hipster earth tones, neon accent",
    },
    ai: { prompt: "2010s social media decade, Instagram culture, smartphone ubiquity, hipster style, streaming wars" },
  },
  {
    code: "ERA_2024",
    visual: {
      label: { ar: "عصرنا الحالي", en: "Present Day" },
      thumbnail: "/thumbnails/eras/era-2024.jpg",
    },
    yearRange: "2024",
    clothing: {
      promptF: "modern contemporary fashion, casual or business attire, smartphone era, diverse styles, sneakers or heels",
      promptM: "modern casual wear or business suit, smartphone era, diverse fashion, sneakers or dress shoes",
    },
    environment: {
      architecture: "modern glass skyscrapers, mixed-use developments, renovated historic buildings",
      streets: "busy city streets with cars and bikes, outdoor cafes, pedestrian zones",
      transport: ["car", "electric vehicle", "subway", "airplane", "bike"],
      lighting: "LED lighting, smartphone screens, city nightlife, natural daylight",
      colorPalette: "all modern colors, neutral tones, bright accents, tech blue",
    },
    ai: { prompt: "present day 2024, modern world, contemporary life, smartphones, internet age, global culture" },
  },

  // ═══════════════════════════════════════════════════════════
  // GROUP 8 — FUTURE + FANTASY (9 eras)
  // ═══════════════════════════════════════════════════════════
  {
    code: "ERA_NEAR_FUTURE",
    visual: {
      label: { ar: "المستقبل القريب", en: "Near Future" },
      thumbnail: "/thumbnails/eras/era-near-future.jpg",
    },
    yearRange: "2050–2100",
    clothing: {
      promptF: "smart fabric clothing with subtle tech integration, minimalist sustainable fashion, AR glasses, sleek athletic wear",
      promptM: "technical fabric garments, smart accessories, AR contact lenses, functional minimalist clothing, urban techwear",
    },
    environment: {
      architecture: "sustainable green buildings, vertical farms, smart cities, climate-adaptive structures",
      streets: "clean energy vehicles, elevated bike lanes, automated transport, solar canopies",
      transport: ["electric autonomous vehicle", "hyperloop", "drone taxi", "electric bike"],
      lighting: "LED smart lighting, holographic displays, natural light optimization",
      colorPalette: "tech white, electric blue, sustainable green, silver, clean neutrals",
    },
    ai: { prompt: "near future 2050-2100, sustainable technology, smart cities, climate solutions, advanced AI integration" },
  },
  {
    code: "ERA_FAR_FUTURE",
    visual: {
      label: { ar: "المستقبل البعيد", en: "Far Future" },
      thumbnail: "/thumbnails/eras/era-far-future.jpg",
    },
    yearRange: "2200+",
    clothing: {
      promptF: "form-fitting adaptive nano-fabric, color-changing smart materials, minimal seams, biometric integration, ethereal elegance",
      promptM: "adaptive nano-suit, smart material that adjusts to environment, integrated technology, sleek futuristic design",
    },
    environment: {
      architecture: "floating arcologies, space habitats, terraformed landscapes, megastructures",
      streets: "anti-gravity transit, teleportation pads, pneumatic tubes, flying vehicles",
      transport: ["anti-gravity vehicle", "teleportation", "space elevator", "personal drone"],
      lighting: "artificial sun simulation, bioluminescent accents, holographic ambient light",
      colorPalette: "chrome silver, holographic shimmer, deep space black, neon accents, pure white",
    },
    ai: { prompt: "far future 2200+, post-scarcity society, advanced technology, space colonization, transhumanism" },
  },
  {
    code: "ERA_SPACE_AGE",
    visual: {
      label: { ar: "عصر الفضاء — كواكب", en: "Space Age — Planetary" },
      thumbnail: "/thumbnails/eras/era-space-age.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "advanced space suit with sleek design, pressure suit with style, helmet with HUD, planetary exploration gear",
      promptM: "streamlined space suit, EVA gear with utility, helmet with display, interplanetary travel attire",
    },
    environment: {
      architecture: "domed habitats, underground colonies, orbital stations, terraforming structures",
      streets: "pressurized corridors, rover paths on Mars, lunar surface walkways",
      transport: ["rocket", "lander", "rover", "orbital shuttle"],
      lighting: "artificial habitat lighting, alien sun, Earth-rise glow, starlight",
      colorPalette: "space black, Mars red, lunar gray, Earth blue, habitat white",
    },
    ai: { prompt: "space colonization age, Mars colonies, lunar bases, orbital habitats, interplanetary civilization" },
  },
  {
    code: "ERA_FANTASY_ANCIENT",
    visual: {
      label: { ar: "فنتازيا قديمة", en: "Ancient Fantasy" },
      thumbnail: "/thumbnails/eras/era-fantasy-ancient.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "flowing mystical robes with ancient symbols, enchanted jewelry, ethereal fabrics that shimmer with magic, circlet of power",
      promptM: "heroic tunic with mystical embroidery, ancient weapon of legend, enchanted cloak, divine armor fragments",
    },
    environment: {
      architecture: "floating temples, crystal ziggurats, ancient ruins with glowing runes, mythical groves",
      streets: "pathways of light, ethereal bridges, enchanted forests, ley line intersections",
      transport: ["magical portal", "flying beast", "teleportation circle", "enchanted boat"],
      lighting: "magical glow, ethereal light, ancient power radiance, mystical aurora",
      colorPalette: "mystic purple, ancient gold, ethereal white, rune blue, forest emerald",
    },
    ai: { prompt: "ancient fantasy world, lost civilizations, primordial magic, mythical artifacts, hero's journey setting" },
  },
  {
    code: "ERA_FANTASY_MEDIEVAL",
    visual: {
      label: { ar: "فنتازيا وسيطة", en: "Medieval Fantasy" },
      thumbnail: "/thumbnails/eras/era-fantasy-medieval.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "enchanted gown with magical embroidery, wizard's apprentice robes, mystical cloak, crystal jewelry, spell components",
      promptM: "knightly armor with magical runes, enchanted sword, wizard robes or ranger gear, mystical cape, adventurer's pack",
    },
    environment: {
      architecture: "wizard towers, enchanted castles, elven tree cities, dwarven mountain halls",
      streets: "cobblestone of magical towns, forest paths, bridge to wizard academy",
      transport: ["horse", "griffin", "magical carriage", "teleportation scroll"],
      lighting: "magical torchlight, spell glow, moonlit enchantment, crystal illumination",
      colorPalette: "magic blue, enchanted silver, deep forest green, royal purple, bronze",
    },
    ai: { prompt: "medieval fantasy, Dungeons and Dragons, Tolkien-esque world, magic and swords, mythical creatures" },
  },
  {
    code: "ERA_FANTASY_STEAMPUNK",
    visual: {
      label: { ar: "ستيم بنك", en: "Steampunk" },
      thumbnail: "/thumbnails/eras/era-fantasy-steampunk.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "Victorian dress with brass gears and leather straps, corset with clockwork details, goggles, top hat with feathers",
      promptM: "tailcoat with brass buttons and gear embellishments, leather vest, top hat with goggles, mechanical arm, pocket watch chains",
    },
    environment: {
      architecture: "brass and copper machinery, steam-powered factories, clockwork towers, Victorian with gears",
      streets: "steam-powered vehicles on cobblestone, pneumatic tubes, gear-driven lifts",
      transport: ["steam carriage", "airship", "mechanical horse", "submarine"],
      lighting: "gaslight mixed with electrical sparks, steam glow, brass reflections",
      colorPalette: "brass gold, copper, steam gray, Victorian burgundy, oil black",
    },
    ai: { prompt: "steampunk world, steam power, clockwork machinery, Victorian futurism, brass and copper aesthetics" },
  },
  {
    code: "ERA_FANTASY_CYBERPUNK",
    visual: {
      label: { ar: "سايبربنك", en: "Cyberpunk" },
      thumbnail: "/thumbnails/eras/era-fantasy-cyberpunk.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "neon-lit jacket with holographic patches, cybernetic implants visible, LED-embedded clothing, street fashion, data jack ports",
      promptM: "black leather jacket with tech wear, glowing implants, cybernetic arm, mirror-shade glasses, tactical gear",
    },
    environment: {
      architecture: "towering megastructures, neon-drenched streets, holographic advertisements, corporate arcologies",
      streets: "crowded neon streets, flying cars above, street markets with tech, rain-slicked alleys",
      transport: ["flying car", "maglev train", "motorcycle", "drone"],
      lighting: "neon glow, holographic advertisements, rain reflections, perpetual twilight",
      colorPalette: "neon pink, electric blue, black, chrome, toxic green",
    },
    ai: { prompt: "cyberpunk dystopia, neon cities, corporate control, hackers, cybernetic enhancements, Blade Runner aesthetic" },
  },
  {
    code: "ERA_FANTASY_POST_APOC",
    visual: {
      label: { ar: "ما بعد الكارثة", en: "Post-Apocalyptic" },
      thumbnail: "/thumbnails/eras/era-fantasy-post-apoc.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "survival gear made from scavenged materials, torn clothing with patches, gas mask, makeshift armor, weathered leather",
      promptM: "wasteland survival outfit, repurposed military gear, road warrior armor, dust mask, scavenged weapons",
    },
    environment: {
      architecture: "ruined cities, rusted structures, makeshift settlements, crashed vehicles",
      streets: "dusty wasteland roads, cracked asphalt, debris-filled streets",
      transport: ["motorcycle", "armored vehicle", "horse", "walking"],
      lighting: "harsh wasteland sun, radioactive glow, firelight camps, dust-filtered light",
      colorPalette: "dust brown, rust orange, toxic yellow, ash gray, dried blood red",
    },
    ai: { prompt: "post-apocalyptic wasteland, Fallout, Mad Max, survival, ruined civilization, radiation zones" },
  },
  {
    code: "ERA_FANTASY_MYTHOLOGICAL",
    visual: {
      label: { ar: "أساطير — أولمب/فالهالا", en: "Mythological — Olympus/Valhalla" },
      thumbnail: "/thumbnails/eras/era-fantasy-mythological.jpg",
    },
    yearRange: "—",
    clothing: {
      promptF: "divine gown of goddess, golden thread fabric, laurel crown, ethereal beauty, divine jewelry, flowing immortal robes",
      promptM: "god's armor or divine robes, thunder weapon, golden crown, divine cape, immortal warrior attire, Olympus style",
    },
    environment: {
      architecture: "Olympus mountain palace, Valhalla hall, divine realm, clouds of gods, golden gates",
      streets: "cloud pathways, rainbow bridge Bifrost, divine gardens, immortal pathways",
      transport: ["divine chariot", "flying", "portal", "magical steed"],
      lighting: "divine golden light, ethereal glow, thunder illumination, immortal radiance",
      colorPalette: "divine gold, cloud white, thunder blue, immortal silver, sunset orange",
    },
    ai: { prompt: "mythological realm, Greek gods Olympus, Norse Valhalla, divine beings, immortal warriors, godly realm" },
  },
] as const;
