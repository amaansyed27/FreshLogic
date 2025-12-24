// Full Crop List from Knowledge Base (92 crops)
// Sourced from FAO/USDA guidelines for Indian agricultural supply chains
// Must match backend/data/crop_storage_data.json exactly

export const CROP_LIST = [
    "Mango (Alphonso)", "Mango (Kesar)", "Mango (Totapuri)", "Mango (Langra)",
    "Banana (Robusta/Cavendish)", "Banana (Yelakki/Elaichi)",
    "Guava (Allahabad Safeda)", "Papaya (Taiwan Red)", "Pomegranate (Bhagwa)",
    "Grapes (Thompson Seedless)", "Grapes (Bangalore Blue)",
    "Sapota (Chiku)", "Custard Apple (Sitaphal)", "Jackfruit (Raw/Kathal)",
    "Litchi (Shahi)", "Sweet Lime (Mosambi)", "Orange (Nagpur Mandarin)",
    "Indian Plum (Ber)", "Jamun", "Amla (Indian Gooseberry)", "Fig (Pune Anjeer)",
    "Watermelon (Kiran)", "Musk Melon (Kharbuja)", "Strawberry", "Pineapple",
    "Avocado", "Dragon Fruit", "Kiwi", "Coconut (Mature)", "Coconut (Tender)",
    "Onion (Nashik Red)", "Potato (Indore/Jyoti)", "Tomato (Desi)", "Tomato (Hybrid)",
    "Brinjal (Eggplant/Baingan)", "Lady Finger (Okra/Bhindi)",
    "Cauliflower (Gobi)", "Cabbage (Patta Gobi)", "Spinach (Palak)",
    "Fenugreek Leaves (Methi)", "Coriander Leaves (Dhania)", "Curry Leaves (Kadi Patta)",
    "Mint (Pudina)", "Drumstick (Moringa)", "Bottle Gourd (Lauki)",
    "Bitter Gourd (Karela)", "Ridge Gourd (Turai)", "Pointed Gourd (Parwal)",
    "Snake Gourd (Chichinda)", "Ivy Gourd (Tindora)", "Ash Gourd (Petha)",
    "Pumpkin (Kaddu)", "Beetroot (Chukandar)", "Turnip (Shalgam)",
    "Sweet Potato (Shakarkandi)", "Tapioca (Cassava)", "Turmeric (Raw)", "Ginger (Adrak)",
    "Garlic (Lahsun)", "Green Chili (Hari Mirch)", "Capsicum (Simla Mirch)",
    "Green Peas (Matar)", "Cluster Beans (Gavar)", "Taro (Arbi)",
    "Elephant Foot Yam (Suran)", "Amaranthus (Chaulai)", "Basil (Tulsi)",
    "Betel Leaf (Paan)", "Sugarcane", "Mushroom (Button)",
    "Wheat (Sharbati)", "Rice (Basmati)", "Rice (Sona Masoori)",
    "Toor Dal (Pigeon Pea)", "Moong Dal (Green Gram)", "Chana Dal (Bengal Gram)",
    "Urad Dal (Black Gram)", "Groundnut (Peanut)",
    "Cardamom (Green)", "Marigold (Genda)", "Jasmine (Mogra)",
    "Rose (Desi)", "Tuberose (Rajnigandha)", "Gladiolus",
    "Chrysanthemum", "Gerbera",
    // 6 crops that were missing - now synced with backend
    "Black Pepper", "Carrot (Gajar - Red)", "Clove", "Cucumber (Kheera)", 
    "Cumin Seeds", "Radish (Mooli)"
].sort();

// Crop categories for optional grouping
export const CROP_CATEGORIES: Record<string, string[]> = {
    "Tropical Fruits": [
        "Mango (Alphonso)", "Mango (Kesar)", "Mango (Totapuri)", "Mango (Langra)",
        "Banana (Robusta/Cavendish)", "Banana (Yelakki/Elaichi)",
        "Papaya (Taiwan Red)", "Pineapple", "Jackfruit (Raw/Kathal)",
        "Coconut (Mature)", "Coconut (Tender)"
    ],
    "Berries & Exotic": [
        "Strawberry", "Grapes (Thompson Seedless)", "Grapes (Bangalore Blue)",
        "Dragon Fruit", "Kiwi", "Avocado", "Litchi (Shahi)"
    ],
    "Citrus": [
        "Orange (Nagpur Mandarin)", "Sweet Lime (Mosambi)"
    ],
    "Local Fruits": [
        "Guava (Allahabad Safeda)", "Pomegranate (Bhagwa)", "Sapota (Chiku)",
        "Custard Apple (Sitaphal)", "Indian Plum (Ber)", "Jamun",
        "Amla (Indian Gooseberry)", "Fig (Pune Anjeer)",
        "Watermelon (Kiran)", "Musk Melon (Kharbuja)"
    ],
    "Root Vegetables": [
        "Onion (Nashik Red)", "Potato (Indore/Jyoti)", "Beetroot (Chukandar)",
        "Turnip (Shalgam)", "Sweet Potato (Shakarkandi)", "Tapioca (Cassava)",
        "Turmeric (Raw)", "Ginger (Adrak)", "Garlic (Lahsun)", "Taro (Arbi)",
        "Elephant Foot Yam (Suran)", "Carrot (Gajar - Red)", "Radish (Mooli)"
    ],
    "Leafy Greens": [
        "Spinach (Palak)", "Fenugreek Leaves (Methi)", "Coriander Leaves (Dhania)",
        "Curry Leaves (Kadi Patta)", "Mint (Pudina)", "Amaranthus (Chaulai)", "Basil (Tulsi)"
    ],
    "Vegetables": [
        "Tomato (Desi)", "Tomato (Hybrid)", "Brinjal (Eggplant/Baingan)",
        "Lady Finger (Okra/Bhindi)", "Cauliflower (Gobi)", "Cabbage (Patta Gobi)",
        "Drumstick (Moringa)", "Green Chili (Hari Mirch)", "Capsicum (Simla Mirch)",
        "Green Peas (Matar)", "Cluster Beans (Gavar)", "Cucumber (Kheera)"
    ],
    "Gourds": [
        "Bottle Gourd (Lauki)", "Bitter Gourd (Karela)", "Ridge Gourd (Turai)",
        "Pointed Gourd (Parwal)", "Snake Gourd (Chichinda)", "Ivy Gourd (Tindora)",
        "Ash Gourd (Petha)", "Pumpkin (Kaddu)"
    ],
    "Grains & Pulses": [
        "Wheat (Sharbati)", "Rice (Basmati)", "Rice (Sona Masoori)",
        "Toor Dal (Pigeon Pea)", "Moong Dal (Green Gram)", "Chana Dal (Bengal Gram)",
        "Urad Dal (Black Gram)", "Groundnut (Peanut)"
    ],
    "Flowers": [
        "Marigold (Genda)", "Jasmine (Mogra)", "Rose (Desi)",
        "Tuberose (Rajnigandha)", "Gladiolus", "Chrysanthemum", "Gerbera"
    ],
    "Others": [
        "Betel Leaf (Paan)", "Sugarcane", "Mushroom (Button)", "Cardamom (Green)",
        "Black Pepper", "Clove", "Cumin Seeds"
    ]
};

export default CROP_LIST;
