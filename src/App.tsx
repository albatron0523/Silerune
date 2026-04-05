/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Data ---
const TRIVIA_DATABASE = [
  "爵位等第由高至低分別為：公爵、侯爵、伯爵、子爵、男爵。",
  "艾洛蒂有一位極其信任的執事，專門替她處理各類繁瑣的雜事。",
  "米蕾優是艾蕾諾菈唯一的「貼身」女僕，雖然府邸內還有多名普通女僕。",
  "艾蕾諾菈私下的愛好非常單純：看書與享用甜食。",
  "路西恩不喜歡運動類活動，更偏好演奏音樂等靜態活動。",
  "莉雪有一位弟弟，她從小就被賦予了「必須養成合格侯爵繼承人」的重責大任。",
  "米蕾優從小作為平民生活在農村，力氣大得驚人。",
  "在故事前期，艾蕾諾菈從未因傷心而哭泣，流過的眼淚僅是生理反射。",
  "驚人的事實：智商超群的艾蕾諾菈，其實是個徹底的路痴。",
  "卡修斯過去常以「確認人民生活狀況」為藉口，理直氣壯地翹掉禮儀課。",
  "路西恩始終戴著手套，其實是為了掩蓋雙手那不為人知的傷疤。",
  "鮮為人知的是，現任學院的行政處長奧斯丁其實曾是路西恩的禮儀老師。"
];

const OBSERVATION_DATABASE = [
  {
    id: 0,
    nameZh: "艾蕾諾菈·克雷瑟",
    nameEn: "Eleanora Cressel",
    colors: { P: "#817bb5", A: "#a29ed4", H: "#928dbf", Q: "#6e68a3", B: "#bdbade" },
    freshman: { quote: "「我就喜歡這樣的你。」", attr: "水", mana: "85%", stability: "81%", talent: "C", ability: "已開發 10%", beastSync: "龍 默契度 65%" },
    graduate: { quote: "「我並不特殊。」", attr: "全", mana: "95%", stability: "90%", talent: "C", ability: "已開發 35%", beastSync: "龍 默契度 92%" }
  },
  {
    id: 1,
    nameZh: "路西恩·法雷蒙",
    nameEn: "Lucien Valemont",
    colors: { P: "#b5a36b", A: "#ccbf93", H: "#c2b484", Q: "#9c8a55", B: "#d6d0b6" },
    freshman: { quote: "「 您是因為利益才拯救我的，不是嗎？ 」", attr: "光", mana: "46%", stability: "81%", talent: "S", ability: "已開發 35%", beastSync: "蝙蝠 默契度 77%" },
    graduate: { quote: "「 在愛上她的那刻，我早已做好赴死的覺悟。 」", attr: "光", mana: "57%", stability: "96%", talent: "S", ability: "已開發 90%", beastSync: "蝙蝠 默契度 94%" }
  },
  {
    id: 2,
    nameZh: "席恩·法雷蒙",
    nameEn: "Cian Valemont",
    colors: { P: "#6b7bb0", A: "#98a3cc", H: "#808cc2", Q: "#5a6a9c", B: "#bcc4e0" },
    freshman: { quote: "「 開什麼玩笑！明明我才是繼承人！」", attr: "水", mana: "42%", stability: "35%", talent: "B", ability: "已開發 40%", beastSync: "蛇 默契度 15%" },
    graduate: { quote: "「 啊啊，你也跟我一樣，對吧？」", attr: "水", mana: "50%", stability: "67%", talent: "B", ability: "已開發 97%", beastSync: "蛇 默契度 83%" }
  },
  {
    id: 3,
    nameZh: "莉雪·瑟蘭",
    nameEn: "Lys Seranne",
    colors: { P: "#6a948e", A: "#8eb5b0", H: "#7da6a0", Q: "#53857e", B: "#b2cfcb" },
    freshman: { quote: "「 我真的不配入你的眼嗎？」", attr: "風", mana: "67%", stability: "70%", talent: "A", ability: "已開發 20%", beastSync: "曜隼 默契度 63%" },
    graduate: { quote: "「 如果歷史從未發生，那就由我來創造。」", attr: "風", mana: "81%", stability: "79%", talent: "A", ability: "已開發 89%", beastSync: "曜隼 默契度 84%" }
  },
  {
    id: 4,
    nameZh: "艾洛蒂·拉維涅",
    nameEn: "Elody Ravigny",
    colors: { P: "#b08698", A: "#c7a3b2", H: "#bd97a7", Q: "#9c7083", B: "#d6c5cb" },
    freshman: { quote: "「 」", attr: "風", mana: "74%", stability: "65%", talent: "B", ability: "已開發 15%", beastSync: "獨角獸 默契度 86%" },
    graduate: { quote: "「為什麼連努力也要攀比呢？你看，這雙手所長出的繭，是只有你有的，就像過程的痛與苦，只有你體驗過一樣。 」", attr: "風", mana: "79%", stability: "79%", talent: "B", ability: "已開發 76%", beastSync: "獨角獸 默契度 97%" }
  },
  {
    id: 5,
    nameZh: "卡修斯·賽西爾",
    nameEn: "Cassius Cecil",
    colors: { P: "#989c6d", A: "#b8bd96", H: "#abb088", Q: "#828757", B: "#cdcfb8" },
    freshman: { quote: "「 因為你是我未來的子民啊！」", attr: "火", mana: "85%", stability: "63%", talent: "S+", ability: "已開發 45%", beastSync: "鳳凰 默契度 64%" },
    graduate: { quote: "「 『愛』究竟是什麼……？」", attr: "火", mana: "90%", stability: "78%", talent: "S+", ability: "已開發 90%", beastSync: "鳳凰 默契度 82%" }
  },
  {
    id: 6,
    nameZh: "奧斯丁·費雪",
    nameEn: "Austin Fisher",
    colors: { P: "#b55d5d", A: "#d4a2a2", H: "#bf8d8d", Q: "#a36868", B: "#debdbd" },
    freshman: { quote: "「 聽好了，路西恩。雖然我們的生活環境告訴我們，這世界的惡意數不勝數，但純粹的善意依然存在。」", attr: "火", mana: "72%", stability: "86%", talent: "S+", ability: "已開發 90%", beastSync: "鳳凰 默契度 89%" },
    graduate: { quote: "「 聽好了，路西恩。雖然我們的生活環境告訴我們，這世界的惡意數不勝數，但純粹的善意依然存在。」", attr: "火", mana: "72%", stability: "86%", talent: "S+", ability: "已開發 90%", beastSync: "鳳凰 默契度 89%" },
    noToggle: true
  },
  {
    id: 7,
    nameZh: "伊維爾·艾凡",
    nameEn: "Yvel Evan",
    colors: { P: "#a19db8", A: "#c4c1d4", H: "#b3afc9", Q: "#7e7a96", B: "#e0deeb" },
    freshman: { 
      quote: "「你為什麼想來這所學校呢?」", 
      attr: "火", mana: "95%", stability: "94%", talent: "A", ability: "已開發70%", beastSync: "鳳凰 默契度60%" 
    },
    graduate: { 
      quote: "「永無止盡。」", 
      attr: "Ω / ALL", mana: "99.9% (OVERFLOW)", stability: "99.9% (OVERFLOW)", talent: "† GOD CHILD †", ability: "UNDEFINED", beastSync: "UNRECOGNIZABLE" 
    },
    isYvel: true
  }
];

// --- Components ---

// --- Components ---
const Library = () => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);

  const chapters = [
    {
      title: "序章",
      meta: "Recorded in Kleiser Estate",
      content: `
        <p>克雷瑟家的餐廳裡，女僕與執事們安靜地站在邊上，長桌上已擺滿各式料理，香氣四溢，只等家中的主人們享用。</p>
        <p>此時淺紫髮的少女走進餐廳，長而濃密的睫毛與白皙的皮膚就如同精緻的人偶活過來一般，她用與胸前湛藍色寶石同色的眼眸看向一旁正在閒聊的父親與白髮少年。</p>
        <p>「艾蕾諾菈，妳來了啊。」克雷瑟公爵勾手示意她靠近，等少女移動到二人面前時，他便搭著少年的肩向少女介紹：「這是我之前跟妳說過的路西恩·法雷蒙——妳的未婚夫。」</p>
        <p>「初次見面，克雷瑟小姐，我是路西恩·法雷蒙。」少年笑著向少女敬禮。</p>
        <p>「……初次見面。」艾蕾諾菈也微微頷首，禮貌地拉起裙擺回應。</p>
        <p>看著二人和諧的樣子，公爵滿意地笑了笑「既然都打完招呼了，我們就上桌吃飯吧。」</p>
        <p>「好的。」路西恩笑著回應，而艾蕾諾菈輕輕點了點頭後便朝自己的座位走去。</p>
        <p>餐具輕碰瓷器的聲音此起彼伏，公爵看著兩位孩子都沒有要開口的想法，於是率先開啟了話題：「艾蕾諾菈，你還記得我們一年前觀賞的音樂會嗎？路西恩就是壓軸演奏小提琴的那位少年喔，我記得你那時有特別誇他的演奏好聽。」公爵笑著看向自己的女兒，艾蕾諾菈停下了進食的動作，抬頭看向坐在對面的路西恩。</p>
        <p>「這是真的嗎？能獲得克雷瑟小姐的讚美我非常榮幸。」路西恩笑著看向艾蕾諾菈，潔白的眼睫毛讓他帥氣的臉龐更為閃耀，如果是一般的大小姐看見如此帥氣的少年對自己笑，早就墜入愛河，但艾蕾諾菈只是輕輕點了點頭，隨後又低頭繼續專注用餐。</p>
        <p>「抱歉啊，路西恩。艾蕾諾菈總是這樣，之後可能要麻煩你辛苦一點了。」公爵笑著打圓場。</p>
        <p>「不會的，我覺得這樣的克雷瑟小姐很有特色，也剛好我比較擅長閒聊……只希望克雷瑟小姐不要嫌棄我就好。」</p>
        <p>「哈哈哈，她怎麼會嫌棄你呢？你可是人人稱羨的『法雷蒙少爺』啊！」</p>
        <p>「呵呵，您過獎了。」</p>
        <p>回應完公爵的路西恩回頭繼續用餐，偶爾「不經意」抬頭看向眼前的少女。</p>
        <p>艾蕾諾菈感受得到金黃色瞳眸對自己的注視——不，是試探，而且是獵人盯上獵物才有 的眼神，但她並不在意，只是不為所動繼續進食，連個眼神都沒給他。</p>
        <p>隨著路西恩一點一滴的觀察，他對「獵物」感到頗為滿意。</p>
        <p>用餐結束，他在無人注意的地方輕笑了一聲，隨後又換回乖巧且溫柔的神情。</p>
        <p>等到月亮高掛天空之際，也是二人結束短暫的交流之時。</p>
        <p>「好了，艾蕾諾菈，跟路西恩說個再見。」</p>
        <p>「……再見。」</p>
        <p>「下次見，克雷瑟小姐。祝您今日——不，每日都有個好夢。」路西恩又對艾蕾諾菈笑了一下才轉身離去，公爵看著路西恩離去的背影，對身旁的女兒問了個問題：「你覺得路西恩怎麼樣？」</p>
        <p>艾蕾諾菈沒有開口，只是看著上了馬車的少年，點了點頭，以表達滿意。</p>
        <p>「這樣啊……那我就放心了。」看到女兒難得第一次見面就給出了肯定的答覆，公爵心情大好。</p>
        <p>月光灑落在馬車裡，路西恩低頭回想艾蕾諾菈的樣貌，不得不說……是真的美得動人。</p>
        <p>如果是吃虧了也不喊痛的人就更好了。</p>
        <p>路西恩想著，已經開始不知不覺期待下次見面。</p>
      `
    },
    {
      title: "第一章",
      meta: "Silerune // Library of Secrets",
      content: `
        <p>希鷺倫（Silerune）——在北方大陸的國家——與南方強國瓦爾托梅爾齊名，其境內礦產豐饒，產業蓬勃發展，其中多數資源掌控於克雷瑟公爵手中，也因此克雷瑟家族財力十分雄厚，家族地位僅次於皇帝。</p>
        <p>而克雷瑟家中僅育有一女——艾蕾諾菈·克雷瑟。</p>
        <p>據說長得如人偶般美麗，擁有與其母親一致的紫羅蘭秀髮，皮膚白皙、身材纖細，也如人偶般極少開口講話，光是坐在一邊就像一件藝術品，僅可遠觀而不可褻玩，但因她很少出門踏青，所以親眼目睹過她真容的人並不多。</p>
        <p>「妳聽說了嗎？那位『法雷蒙少爺』竟然與克雷瑟公爵之女訂婚了！」</p>
        <p>「真的嗎？我原本還以為我有機會的說……不過也是，如果是克雷瑟公爵之女的話與他確實門當戶對。」</p>
        <p>貴族少女們悄悄討論著最新得知的消息，而話題的主角——路西恩·法雷蒙——正坐馬車緩緩駛入克雷瑟宅邸。</p>
        <p>進入克雷瑟家中，路西恩熟捻地敲了敲休息室的門，隨後退一步，靜待女僕應聲。</p>
        <p>「歡迎您，法雷蒙少爺。」大門隨著女僕的話語敞開。</p>
        <p>映入眼簾的即是正安靜讀書的紫髮少女，微垂的眼眸顯得睫毛更為細長，襯著她小巧的面容，更添了幾分不染塵埃的精緻。</p>
        <p>聽到聲響的艾蕾諾菈偏頭看向來人。</p>
        <p>「下午好，克雷瑟小姐。」路西恩向前走了幾步，接著將藏在身後的花束拿到身前：「這束花是毛茛，花語是『您很迷人』與『傾心不已』，願您能喜歡。」花朵五彩繽紛，個個都亮麗地綻放著。</p>
        <p>艾蕾諾菈看著花束點了點頭，接著轉頭看向一旁的女僕，女僕會意接過花朵，將櫃子上即將凋零的花汰換。</p>
        <p>沒什麼反應，是不喜歡嗎……。</p>
        <p>路西恩暗中觀察艾蕾諾菈的神情。</p>
        <p>那一瞬間，他竟有些許不安。</p>
        <p>不，我是在緊張什麼？</p>
        <p>不論對方喜不喜歡都與自己無關不是嗎？</p>
        <p>更況自己隱含的譏諷貌似都沒被發現……這應該是理想的結果才對。</p>
        <p>為了平復情緒，路西恩坐入一旁的空位，並拿起茶杯輕抿。</p>
        <p>紅茶還是一如既往地香。</p>
        <p>為了與聯姻對象熟悉，他已來拜訪克雷瑟家不下五次，對屋內的格局已經略知一二，也試探過艾蕾諾菈允許自己自由活動的程度。</p>
        <p>不過他最喜歡的空間還是現在所待的休息室，不只甜點好吃，也能與艾蕾諾菈一起坐著休息，這對平常課業繁重的路西恩來說是難得能放鬆的時光。</p>
        <p>短暫沉默後，路西恩開口：「不好意思……請問您有書籍可以借我閱讀嗎？」</p>
        <p>艾蕾諾菈抬眸，點頭，並起身往休息室門口走去。</p>
        <p>「非常感謝您。」他起身跟上。</p>
        <p>經過狹長的走廊與一個轉角，二人在別棟停下，艾蕾諾菈用白皙的雙手將大門推開，如祕境般的圖書館徹底拋頭露面。</p>
        <p>三層樓高的書架林立，每一寸牆面都有書本的蹤影。</p>
        <p>雖然有聽說過公爵之女十分喜愛閱讀，但藏書量之大還是讓路西恩微微倒抽一口氣。</p>
        <p>「太、太壯觀了……原來您有那麼多藏書。」路西恩有一瞬不知如何繼續接話，但還是趕忙找回狀態「您比較喜歡哪種類型的書籍？」</p>
        <p>「都喜歡。」艾蕾諾菈迅速回答「但最喜歡數學。」</p>
        <p>「原來如此……那請您推薦一本相關的書籍給我吧。」</p>
        <p>她點頭，走向某一排書架，並到深處停下。她伸手想拿一本書籍，卻差一點才能勾著。</p>
        <p>「您拿不到嗎？讓我來——」路西恩才剛伸手，便被細嫩冰涼的手指給抓住了手腕。</p>
        <p>……？！</p>
        <p>眼前少女銳利的目光轉瞬即逝，反應過來只剩她皺眉頭看著自己的樣子，像是在表達：「我自己來。」</p>
        <p>明明是拒絕的神情，卻在她精緻的五官下，莫名的……可愛。</p>
        <p>「十分抱歉，是我失禮了。」路西恩將手收回，低頭揉了揉手腕。</p>
        <p>儘管驚嚇已過，心跳卻仍沒有恢復原狀。</p>
        <p>他感受著體內像鼓點一樣沉重的心跳聲，心情複雜。</p>
        <p>剛剛的眼神是錯覺嗎……？</p>
        <p>而且皺眉的表情意外地可愛——不對，這不是重點。</p>
        <p>艾蕾諾菈踮腳幾下，終於將書抽了出來。</p>
        <p>《概形之語——代數幾何初論》——對路西恩來說是多麼熟悉又遙遠的書名。</p>
        <p>他曾聽叔父提到過代數幾何，但在得知這是大學甚至以後才會學到的知識後，便也沒再多加留意。</p>
        <p>而眼前與自己同齡的少女，已經到了能將書籍推薦給別人的程度。</p>
        <p>從未聽說過相關的傳聞。</p>
        <p>看著她神色自若將書本遞給自己的樣子，路西恩手心微微出汗。</p>
        <p>「謝謝您。」他接過書，垂下眼。</p>
        <p>今日——即使無法理解，也要將它讀完。</p>
        <p>他撫摸著書封。</p>
        <p>那是他對自尊的最後堅持。</p>
      `
    },
    {
      title: "第二章",
      meta: "The Tea Party Invitation",
      content: `
        <p>「大小姐，這是寄給您的書信。」女僕將信恭敬地遞到桌前。</p>
        <p>艾蕾諾菈接過包裝精緻的信封並將其拆開，不意外地，是茶會邀請。</p>
        <p>過去她曾收過不少邀請，但都一一推拒掉了，隨著時間推移，會寄到她手上的信也只剩寥寥幾封知心好友的來信，再次收到如此正式的邀請函倒是兩年來第一次。</p>
        <p>她看了看署名人——莉雪·瑟蘭。</p>
        <p>瑟蘭侯爵家長年與克雷瑟公爵家不對付，再加上過去有她心悅於路西恩的傳聞……不難想像她的目的。</p>
        <p>如果這次又拒絕，路西恩一定會被刁難吧。</p>
        <p>雖然他應該能完美化解——但讓人們加深對「法雷蒙少爺未婚妻」的負面印象，可不是什麼明智之舉。</p>
        <p>「答應她吧。」艾蕾諾菈將信交還給身旁的女僕。</p>
        <p>「咦……好、好的！」女僕接過信，表情有肉眼可見的驚訝。</p>
        <p>有那麼誇張嗎……。</p>
        <p>雖然自己確實沒怎麼答應過茶會邀請，但並不是討厭，只是稍微懶惰點而已。</p>
        <p>正當她重新轉回思緒，門外響起敲門聲與熟悉的聲音。</p>
        <p>「打擾了，我是路西恩·法雷蒙。」</p>
        <p>少年一進房，便將手中的禮盒交付：「請您拆開看看吧。」</p>
        <p>艾蕾諾菈輕輕拆開禮盒——是造型精緻的花瓶。</p>
        <p>「上次送了毛茛後總覺得不夠周全……所以又挑了與毛茛相配的花瓶，不知您覺得如何？」</p>
        <p>若是一般人聽到了這樣的解釋便不會多想，只認為是份體面禮物，但艾蕾諾菈深知，這仍是對自己在社交界評價的諷刺。</p>
        <p>她看著花瓶點了點頭，眼中沒有絲毫敷衍，只有對禮物真心的認同。</p>
        <p>暗諷並不重要，重點是那精細的工藝與著色，鐵定是他花了不少時間才挑得的。</p>
        <p>「您喜歡就好。」路西恩笑得明艷，眼中似有光閃過。</p>
        <p>趁女僕換花瓶之際，艾蕾諾菈突然開口：「我……要出門。」</p>
        <p>——「買新衣服？」路西恩聽了她簡短的講解後理解了緣由「原來您也要參加了『白茗會』啊……那我也得同行呢。」</p>
        <p>「不過挑衣服的話，我在閒暇之際也略有研究，不知我能否一同前往？」路西恩提問，話語中帶著隱隱的期盼。</p>
        <p>艾蕾諾菈點頭：「我去換衣服。」</p>
        <p>沒過多久，大宅門前響起腳步聲，紫髮少女終於現身。</p>
        <p>原本她在家穿的衣服都以輕便為主，但外出時所穿的服裝做工精美，有更多的精巧的設計，但這倒又讓她更像美麗的人偶——不，或許比真的人偶還精緻。</p>
        <p>路西恩看著她不禁愣了神，心臟重重地落下一拍，但艾蕾諾菈並無理會，逕直朝馬車走去。</p>
        <p>隨著最後一絲紫髮拂過路西恩的臉頰，他才回過神，隨即跟上。</p>
        <p>馬車內安靜地嚇人。</p>
        <p>車子偶爾會因顛簸發出聲響，卻仍蓋不過路西恩劇烈的心跳聲。</p>
        <p>他原以為剛剛只是被驚艷到，但不論過了多久，只要那位少女還坐在自己面前，他的心跳就沒有一絲一毫減緩，仍舊像鼓點一樣重重地落下節拍。</p>
        <p>一般人在感受到心動的時刻，只會好好享受多巴胺帶來的甜蜜，但新情感的出現卻令他恐慌——明明他從小就是被仰慕的那一方。</p>
        <p>他曾看過不少人在自己面前羞紅著臉，不敢向前的樣子，這時他會刻意前進與對方搭話，看著對方驚惶失措的樣子，滿意地笑，順便給對方一點甜頭，讓對方為自己所用。</p>
        <p>錯了，一切都錯了。</p>
        <p>他在面無波瀾的外表下，悄悄深呼吸了數次，才讓狂跳的心臟平靜下來。</p>
        <p>窗外的場景不知不覺從私人花園變換成了繁華的街道。</p>
        <p>馬車停下，路西恩率先下了車，隨後轉身向艾蕾諾菈伸出手：「請小心腳步，克雷瑟小姐。」</p>
        <p>在她的手搭上去的那一刻，他戴著白手套的手不由自主地顫了一下。</p>
        <p>她似乎也察覺到了——靛藍色的瞳眸向自己瞥了一眼又收回視線。</p>
        <p>心臟又再次不安定了起來，但這次，是被察覺所造成的慌亂。</p>
        <p>冷靜，路西恩。</p>
        <p>他將手撤回，裝作無視發生的樣子與少女並肩而行。</p>
        <p>「你看你看，是克雷瑟千金和法雷蒙少爺……！」</p>
        <p>「才剛訂婚就能一起出門逛街了嗎？感情真好……。」</p>
        <p>俊男美女走在街上的樣子很快吸引了眾人的目光，四周開始傳出一些竊竊私語之聲，但二人並不理會。</p>
        <p>「您今天是要逛哪家店呢？」路西恩笑著向身旁的少女提問。</p>
        <p>為了了解少女們的興趣、擴張人脈，他也研究過不少服飾店，如果對方去了自己熟悉的店面的話，自己也能適時提供幫助。</p>
        <p>艾蕾諾菈沒有回答，只是轉身走進不起眼的小巷。</p>
        <p>路西恩不明所以跟上，最終二人在一扇木門前停下。</p>
        <p>房子看著就有些老舊，但入口的台階與門打掃得很乾淨，看得出房屋主人的用心。</p>
        <p>艾蕾諾菈將門推開，隨著鈴聲響起，屋內的裁縫師也抬頭看向他們。</p>
        <p>「啊～克雷瑟大小姐！又來了啊，歡迎歡迎。」男人的年紀不小，銀白色的髮絲夾雜在黑髮間，看起來有點白髮蒼蒼，但身體還算健朗。</p>
        <p>「旁邊這位是……法雷蒙少爺？！」男人嚇得差點把手上的布掉在地上。</p>
        <p>「初次見面，我是路西恩·法雷蒙，克雷瑟小姐的未婚夫。」路西恩彬彬有禮地鞠躬。</p>
        <p>「初次見面，我是阿爾班・梅里維爾！我之前有看過您在我老家舉辦的公益演出，很慶幸能在這裡見到您！您這次是陪艾蕾諾菈大小姐訂製衣服的嗎？先請坐吧，我現在去倒杯茶來。」</p>
        <p>「訂製衣服……？」</p>
        <p>「是的，大小姐的衣服都是在這裡訂製所得，是這間店的常客。」在艾蕾諾菈身後的女僕開口。</p>
        <p>「原來如此……」路西恩低頭沉思。</p>
        <p>訂製衣服在貴族的圈子裡並不是罕見事，但通常都會找大牌子訂製，更有錢些則會專門找知名設計師，幾乎不會來找默默無聞的裁縫師。</p>
        <p>而她居然願意大老遠出門來這種地方……。</p>
        <p>「感謝妳的回應……請問妳的名字是？」路西恩提問。</p>
        <p>「啊，失禮了，我一直沒正式介紹自己。」女僕提起裙擺敬禮「我是米蕾優·布朗雪，艾蕾諾菈大小姐的貼身僕人。」</p>
        <p>「幸會，布朗雪小姐。」路西恩笑著回應。</p>
        <p>「大小姐這次要什麼款式的衣服？」阿爾班問。</p>
        <p>「茶會……6月的。」</p>
        <p>「這樣啊，那就是夏季服裝了呢！這次一樣是自由設計嗎？」</p>
        <p>艾蕾諾菈輕輕點了點頭。</p>
        <p>「好的！我必不會讓您失望！您先照慣例挑選您要的布料吧！」阿爾班擼起袖子，起身開始做事前準備，看起來躍躍欲試。</p>
        <p>艾蕾諾菈點頭，隨後走向一旁的櫃子，慢慢地挑選。</p>
        <p>路西恩在一旁邊喝著紅茶邊靜靜觀察她。</p>
        <p>他自己其實對布料也略有研究，但看她在挑選時如此輕車熟路的樣子，貿然干涉只會讓她生氣吧——像上次一樣。</p>
        <p>雖然只能在一旁休息悶得他心慌，但他也毫無辦法。</p>
        <p>不久，艾蕾諾菈將幾片小布料拿到阿爾班面前。</p>
        <p>「唔喔～您在布料的搭配上真的很有品味！如果是用這些種類來製作的話絕對沒問題，您就敬請期待吧！」阿爾班說著，隨後拿出一個袋子「對了，您上次訂製的衣服好了。」阿爾班將袋子遞出，米蕾優向前接過，接著恭敬地退到原位。</p>
        <p>阿爾班打量著艾蕾諾菈的衣著，滿意地笑了：「您現在穿的就是我上次給您的那套啊！穿起來感覺如何？」</p>
        <p>她點頭，表情雖然沒有笑容，卻讓人感覺有淡淡的暖意。</p>
        <p>——那是路西恩未曾看過的。</p>
        <p>她感到開心會是這種感覺嗎？</p>
        <p>一陣挫敗感襲來。</p>
        <p>原本他將她的冷淡潛意識歸咎為不善表達，但如今，他知道他錯了。</p>
        <p>「大小姐，差不多要回宅邸了。」米蕾優低聲提醒。</p>
        <p>艾蕾諾菈點頭，朝門口走去。</p>
        <p>在門板完全遮蓋阿爾班的面孔前，都能聽到他說著「再見」的宏亮聲音。</p>
        <p>或許是他的活力感染了艾蕾諾菈，她在回程的路上感覺格外開心。</p>
        <p>走出巷子，回到人來人往的街道，高級的店面也變多了起來，在經過某家甜點店時，艾蕾諾菈突然停下腳步，被櫥窗中的甜點吸引。</p>
        <p>「您有看到喜歡的甜點嗎？」路西恩也隨之停下腳步跟著看向她注視的目光。</p>
        <p>艾蕾諾菈對他點頭，感覺力道比平常重了些，而且不知是否被剛剛的好情緒影響，她感覺雙眼都在發光。</p>
        <p>看到艾蕾諾菈難得擺出雀躍的表情，路西恩稍微頓了下，隨後低頭看向櫥窗：「『露霧花酥』嗎……是每年春季才有的限定商品呢，難怪您那麼想要。我馬上為您購買。」</p>
        <p>沒過多久，路西恩便提著精緻的小袋子從店內走出。</p>
        <p>「我多買了幾盒，如果可以的話，希望能與您下次一同在宅邸享用。」</p>
        <p>艾蕾諾菈思索片刻，點頭答應。</p>
        <p>「感謝您。」路西恩說完，米蕾優接過了袋子，隨後三人一同往馬車的方向前進。</p>
      `
    }
  ];

  const chapter = chapters[currentChapter];

  return (
    <div className="archive-container">
      <div className="sidebar-archive">
        <div className="sidebar-header-archive">ARCHIVE // 希鷺倫日誌</div>
        <ul className="chapter-list">
          {chapters.map((ch, idx) => (
            <li 
              key={idx} 
              className={`chapter-item ${currentChapter === idx ? 'active' : ''}`} 
              onClick={() => {
                setCurrentChapter(idx);
                if (readerRef.current) readerRef.current.scrollTop = 0;
              }}
            >
              {ch.title}：{idx === 0 ? '未婚夫' : idx === 1 ? '圖書館' : '白茗會'}
            </li>
          ))}
        </ul>
      </div>

      <div className="main-content-archive" id="reader" ref={readerRef}>
        <div className="article-body">
          <h1 className="article-title">{chapter.title}</h1>
          <div className="article-meta">{chapter.meta}</div>
          <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
          
          <div className="mobile-back-to-top">
            <button onClick={() => {
              if (readerRef.current) {
                readerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              回到頂部
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingSupplement = () => {
  const settingsDatabase = [
    {
      category: "能量",
      title: "魔力增長規律",
      content: "魔力量並非固定不變，透過冥想與實戰可獲得穩定增長，但每個體質皆存在一個<span class='highlight'>「隱形上限值」</span>，一旦觸及上限，後續的開發難度將呈幾何級數上升。"
    },
    {
      category: "技術",
      title: "規模與精度",
      content: "<span class='highlight'>魔力量</span>直接影響魔法的影響範圍與物理威力；而<span class='highlight'>穩定性</span>則決定了魔法技術的細膩程度。魔力極高但穩定性極低者，容易造成魔力暴走。"
    },
    {
      category: "共生",
      title: "魔獸契合度",
      content: "魔獸與其主人的<span class='highlight'>擅長屬性</span>息息相關。屬性越接近，同步率（Sync Rate）越高，發揮出的複合魔法威力也越強。"
    },
    {
      category: "階級",
      title: "魔獸稀有度",
      content: "根據學院紀錄，<span class='highlight'>龍</span>為極稀有級別，<span class='highlight'>鳳凰</span>屬於稀有級別。相較之下，蝙蝠、蛇、<span class='highlight'>曜隼</span>與獨角獸等則在貴族階層中較為普遍。"
    }
  ];

  const [item, setItem] = useState<{category: string, title: string, content: string} | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * settingsDatabase.length);
    setItem(settingsDatabase[randomIndex]);
  }, []);

  if (!item) return null;

  return (
    <div className="setting-container">
      <div className="setting-header">System Supplement // 資訊補充</div>
      <div className="setting-item">
        <span className="setting-title">
          <span className="category-tag">{item.category}</span>{item.title}
        </span>
        <div className="setting-content" dangerouslySetInnerHTML={{ __html: item.content }} />
      </div>
      <div className="setting-footer">ACADEMY ARCHIVE SECTION</div>
    </div>
  );
};

const ObservationCard: React.FC<{ charId: number, onShuffle: () => void }> = ({ charId, onShuffle }) => {
  const [isGraduated, setIsGraduated] = useState(false);
  const data = OBSERVATION_DATABASE.find(c => c.id === charId);
  if (!data) return null;

  const current = isGraduated ? data.graduate : data.freshman;
  const isCorrupted = (data as any).isYvel && isGraduated;

  return (
    <div className={`observation-card ${isCorrupted ? 'corrupted' : ''}`} style={{ 
      '--P': isCorrupted ? '#ff4d4d' : data.colors.P, 
      '--A': isCorrupted ? '#666' : data.colors.A, 
      '--H': isCorrupted ? '#000' : data.colors.H, 
      '--Q': isCorrupted ? '#eee' : data.colors.Q, 
      '--B': isCorrupted ? '#444' : data.colors.B 
    } as React.CSSProperties}>
      <div className="file-header">
        {isCorrupted ? "◈ WARNING: SYSTEM ERROR ◈" : ((data as any).isYvel ? "STUDENT FILE 00" : "STUDENT FILE")}
      </div>
      <div className="card-controls">
        {!data.noToggle && (
          <button className="toggle-btn mr-2" onClick={() => setIsGraduated(!isGraduated)}>
            {(data as any).isYvel 
              ? (isGraduated ? "RESTORE: ???" : "OBSERVE: 入學") 
              : `OBSERVE: ${isGraduated ? "畢業" : "入學"}`}
          </button>
        )}
        <button className="toggle-btn" onClick={onShuffle}>
          切換檔案
        </button>
      </div>
      <div className="name-container">
        <span className="name-zh" key={`zh-${charId}-${isGraduated}`}>{data.nameZh}</span>
        <span className="name-en" key={`en-${charId}-${isGraduated}`}>{data.nameEn}</span>
      </div>
      <div className="quote" key={`quote-${charId}-${isGraduated}`}>
        {current.quote}
      </div>
      <div className="stats-grid">
        <div className="stat-group">
          <div className="stat-item" style={{ animationDelay: '1.3s' }} key={`attr-${charId}-${isGraduated}`}>
            <span className="stat-label">擅長屬性</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.attr}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.5s' }} key={`mana-${charId}-${isGraduated}`}>
            <span className="stat-label">魔力總量</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.mana}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.7s' }} key={`stab-${charId}-${isGraduated}`}>
            <span className="stat-label">魔法穩定性</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.stability}</span>
          </div>
        </div>
        <div className="stat-group">
          <div className="stat-item" style={{ animationDelay: '1.3s' }} key={`talent-${charId}-${isGraduated}`}>
            <span className="stat-label">劍術資質</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.talent}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.5s' }} key={`ability-${charId}-${isGraduated}`}>
            <span className="stat-label">劍術能力</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.ability}</span>
          </div>
          <div className="stat-item" style={{ animationDelay: '1.7s' }} key={`beast-${charId}-${isGraduated}`}>
            <span className="stat-label">魔獸：</span>
            <span className={`stat-value ${isCorrupted ? 'glitch' : ''}`}>{current.beastSync}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wikiTab, setWikiTab] = useState('w1');
  const [charTab, setCharTab] = useState('c1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState("00 Days 00 Hours 00 Mins 00 Secs");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<string | null>(null);
  const [randomCharId, setRandomCharId] = useState(0);
  const [seenCharIds, setSeenCharIds] = useState<number[]>([]);
  const [currentTrivia, setCurrentTrivia] = useState("");
  const [triviaRotation, setTriviaRotation] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Initialize random character and trivia
  useEffect(() => {
    const allIds = OBSERVATION_DATABASE.map(c => c.id);
    const randomId = allIds[Math.floor(Math.random() * allIds.length)];
    setRandomCharId(randomId);
    setSeenCharIds([randomId]);
    
    const randomTrivia = TRIVIA_DATABASE[Math.floor(Math.random() * TRIVIA_DATABASE.length)];
    setCurrentTrivia(randomTrivia);
    setTriviaRotation(Number((Math.random() * 4 - 2).toFixed(1)));
  }, []);

  const shuffleChar = () => {
    const allIds = OBSERVATION_DATABASE.map(c => c.id);
    const remainingIds = allIds.filter(id => !seenCharIds.includes(id));
    
    if (remainingIds.length === 0) {
      // All characters seen, reset pool but avoid immediate repeat if possible
      const resetIds = allIds.filter(id => id !== randomCharId);
      const nextId = resetIds[Math.floor(Math.random() * resetIds.length)];
      setRandomCharId(nextId);
      setSeenCharIds([nextId]);
    } else {
      const nextId = remainingIds[Math.floor(Math.random() * remainingIds.length)];
      setRandomCharId(nextId);
      setSeenCharIds([...seenCharIds, nextId]);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (activeTab === 'char') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date().getTime() - new Date(2025, 4, 28).getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimer(`${d} Days ${h} Hours ${m} Mins ${s} Secs`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Logic
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pct * audioRef.current.duration;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        id="sidebar"
        initial={{ left: -260 }}
        animate={{ left: isSidebarOpen ? 0 : -260 }}
        className={`fixed top-0 w-[240px] h-full bg-white z-[9999] shadow-2xl pt-20 ${isSidebarOpen ? 'active' : ''}`}
      >
        <ul className="sidebar-menu">
          <li className={`nav-item ${activeTab === 'home' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}>HOME</li>
          <li className={`nav-item ${activeTab === 'char' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('char'); setIsSidebarOpen(false); }}>CHARACTERS</li>
          <li className={`nav-item ${activeTab === 'library' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('library'); setIsSidebarOpen(false); }}>LIBRARY</li>
          <li className={`nav-item ${activeTab === 'art' ? 'active-nav' : ''}`} onClick={() => { setActiveTab('art'); setIsSidebarOpen(false); }}>GALLERY</li>
        </ul>
      </motion.div>

      {/* Menu Button */}
      <div id="menuBtn" onClick={() => setIsSidebarOpen(true)}>
        <div></div><div></div><div></div>
      </div>

      {/* Main Content */}
      <main className="w-full">
        {/* Tab: Home */}
        {activeTab === 'home' && (
          <div className="sub-page active">
            <div className="top-content">
              <div className={`player-container ${isPlaying ? 'playing' : ''}`} id="player">
                <div className="record-box">
                  <div className="record">
                    <div className="record-img"></div>
                  </div>
                </div>
                <div className="info-side">
                  <div className="font-bold text-[#8a7f9c] text-sm mb-1">《 蜜月アン・ドゥ・トロワ 》</div>
                  <div className="progress-wrapper" onClick={seek}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="controls">
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}><SkipBack size={18} /></div>
                    <div className="btn" onClick={togglePlay}>
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </div>
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}><SkipForward size={18} /></div>
                    <div className="btn" onClick={() => audioRef.current && (audioRef.current.currentTime = 0)}><RotateCcw size={18} /></div>
                  </div>
                </div>
                <audio 
                  ref={audioRef}
                  src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/蜜月アン・ドゥ・トロワ_ DATEKEN 【ピアノカバー】_320k (1).mp3" 
                  loop 
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>

              <div className="intro-section">
                <div className="line line-1">這是關於面臨困境的青少年們</div>
                <div className="line line-2">如何成長的故事</div>
              </div>

              <div className="timer-section">
                <div className="timer-label">Eleanora Cressel & Lucien Valemont</div>
                {timer}
              </div>

              <div className="wiki-section">
                <div className="tabs">
                  <div className={`tab-btn ${wikiTab === 'w1' ? 'active' : ''}`} onClick={() => setWikiTab('w1')}>✧༺ 世界觀 ༻✧</div>
                  <div className={`tab-btn ${wikiTab === 'w2' ? 'active' : ''}`} onClick={() => setWikiTab('w2')}>✧˖° 國家</div>
                  <div className={`tab-btn ${wikiTab === 'w3' ? 'active' : ''}`} onClick={() => setWikiTab('w3')}>✧˖° 家族</div>
                </div>
                <div className="wiki-content-area">
                  {wikiTab === 'w1' && (
                    <div className="content-pane active">
                      <h3>✧ 核心設定</h3>
                      ✦ 科技、階級、禮儀與普遍思想道德與中世紀歐洲相似，但仍有捏造成分<br />
                      ✦ 擁有魔法系統，黑市有蠻多魔藥與禁書的交易<br />
                      ✦ 魔法的原理是透過魔力操縱原子移動，但世人們並不知道「原子」的概念<br />
                      ✦ 黑魔法為操縱生物細胞（尤其神經細胞）的魔法，但這些魔法的使用途徑如果有經過法律認證的話就是合法的普通魔法（有點像是嗎啡能當麻醉也能當毒品的概念）<br />
                      ✦ 為避免幼兒不會控制魔力時就對生物使用魔力，所以嬰兒出生時都會施加魔法加以限制
                    </div>
                  )}
                  {wikiTab === 'w2' && (
                    <div className="content-pane active">
                      <h3>✧ 希鷺倫 (Silerune)</h3>
                      ✦ 北方強國，坐擁豐富礦產，因此工業發達<br />
                      ✦ 將「水」視為信仰，當作與上帝溝通的渠道，秋季的豐收季時會舉辦慶典「潤恩節」，皇帝會邀請水系魔法師上台表演，民間也會有大量的攤販舉國歡慶<br />
                      ✦ 有北方聖地「艾爾哈爾達（Eirhalda）」，氣候雖寒冷但仍有許多人來朝聖
                      <h3>✧ 瓦爾托梅爾 (Valtomere)</h3>
                      ✦ 南方強國，因氣候溫暖盛產農產<br />
                      ✦ 內鬥頻繁，治安不穩，黑魔法師較多
                    </div>
                  )}
                  {wikiTab === 'w3' && (
                    <div className="content-pane active">
                      <h3>✧ 克雷瑟家族 (Cressel)</h3>
                      ✦ 地位：公爵。財力雄厚，領地大。<br />
                      ✦ 公爵雷納德寵妻女但政治果斷，夫人長年臥病，僅有一女。
                      <h3>✧ 法雷蒙家族 (Valemont)</h3>
                      ✦ 地位：伯爵。前伯爵傑羅得犧牲，遺孤路西恩被公爵艾多里安收養。<br />
                      ✦ 養父母憎恨其光環，將路西恩訓練成完美少爺。<br />
                      ✦ 親子席昂因高壓教育成長，對路西恩有嫉妒心但心不壞。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Character */}
        {activeTab === 'char' && (
          <div className="sub-page active">
            <div className="top-content">
              <div className="char-container">
                <ObservationCard key={randomCharId} charId={randomCharId} onShuffle={shuffleChar} />
                <SettingSupplement />
                <div className="char-nav">
                  <div className={`char-node ${charTab === 'c1' ? 'active' : ''}`} onClick={() => setCharTab('c1')}>ELEANORA</div>
                  <div className={`char-node ${charTab === 'c2' ? 'active' : ''}`} onClick={() => setCharTab('c2')}>LUCIEN</div>
                  <div className={`char-node ${charTab === 'c3' ? 'active' : ''}`} onClick={() => setCharTab('c3')}>OTHERS</div>
                </div>
                <div className="char-scroll-area">
                  {charTab === 'c1' && (
                    <div className="char-content active">
                      <div className="char-flex">
                        <div className="text-side">
                          <div className="char-title">艾蕾諾菈·克雷瑟</div>
                          
                          <span className="section-title">★ 基本資訊</span>
                          - 性別：女 / 年齡：12歲 / 身高：148<br />
                          - 路西恩的聯姻對象
                          <span className="section-title">★ 外貌與穿著</span>
                          ✦ 紫羅蘭色長髮+靛藍色瞳眸，如人偶般精緻<br />
                          ✦ 常綁公主頭配大蝴蝶結，佩戴寶石項鍊(母親送給自己的禮物）
                          <span className="section-title">★ 個性特質</span>
                          ✦ 寡言/少笑，認為兩種行為都耗能量<br />
                          通常講話字數都偏少，大部分回覆以點頭搖頭代替<br />
                          ✦ 智商超群，魔法資質高，但並沒有要展露頭角的想法<br />
                          ✦ 洞悉惡意卻反應薄弱，帶點天然呆屬性
                        </div>
                        <div className="img-side">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題855_20250528195215 (1).png" alt="Eleanora" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>
                  )}
                  {charTab === 'c2' && (
                    <div className="char-content active">
                      <div className="char-flex">
                        <div className="text-side">
                          <div className="char-title">路西恩・法雷蒙</div>
                          
                          <span className="section-title">★ 基本資訊</span>
                          - 性別：男 / 年齡：12歲 / 身高：161<br />
                          - 艾蕾諾菈的聯姻對象
                          <span className="section-title">★ 外貌與穿著</span>
                          ✦ 白短髮+不對稱鬢髮，金黃色雙瞳<br />
                          ✦ 戴黑十字架耳環與白手套
                          <span className="section-title">★ 個性特質</span>
                          ✦ 因長期受法雷蒙伯爵與伯爵夫人虐待，養成腹黑屬性<br />
                          常掛紳士笑容，實則擅長暗諷<br />
                          ✦ 智商偏高，有操盤政治的潛質，但目前心智不成熟，面對超出預想範圍的事較容易慌亂<br />
                          ✦ 內在敏感脆弱的傲嬌少年，面對心上人易害羞。
                        </div>
                        <div className="img-side">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題855_20250528195215.png" alt="Lucien" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>
                  )}
                  {charTab === 'c3' && (
                    <div className="char-content active">
                      <div className="support-item">
                        <div className="support-avatar">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題886_20250618214443.png" alt="Mireille" referrerPolicy="no-referrer" />
                        </div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 米蕾優·布朗雪</div>
                          <div className="support-desc">
                            ✦ 艾蕾諾菈的貼身女僕<br />
                            ✦ 溫和且是少數能讀懂艾蕾諾菈心意的人<br />
                            ✦ 過去是在農村成長的平民，力氣頗大也擅長家事
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題913_20250708151336.png" alt="Licia" referrerPolicy="no-referrer" />
                        </div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 莉雪·瑟蘭</div>
                          <div className="support-desc">
                            ✦ 瑟蘭侯爵千金<br />
                            ✦ 家族長年與克雷瑟家不對付，並有野心吞噬對方<br />
                            ✦ 因家教+心儀路西恩對艾蕾諾菈心生嫉恨<br />
                            ✦ 擅長社交而擁有不少人脈
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">席恩</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 席恩·法雷蒙</div>
                          <div className="support-desc">
                            ✦ 路西恩的表哥<br />
                            ✦ 被父母寵溺+寄予厚望，養成粗俗又自卑的個性，相比路西恩像還沒社會化的小孩<br />
                            ✦ 嫉妒路西恩所擁有的聲望與能力
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">
                          <img src="https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/無標題915_20260109111842.png" alt="Elody" referrerPolicy="no-referrer" />
                        </div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 艾洛蒂·拉維捏</div>
                          <div className="support-desc">
                            ✦ 瓦爾托梅爾的公爵千金<br />
                            ✦ 艾蕾諾菈的筆友，在學院與她第一次見面並迅速成為常常互動的朋友<br />
                            ✦ 率真靈活，擅長引導他人走出傷痛
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">伊維爾</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 伊維爾·艾凡</div>
                          <div className="support-desc">
                            ✦ 魔法學院的校長，古老神話「奧雷菲斯・維洛恩」的後裔，有其遺物<br />
                            ✦ 小男孩，舉止跳脫古怪，常被誤會是一年級新生<br />
                            ✦ 魔法實力強大到足以滅國，被譽為「神之子」<br />
                            ✦ 據說是前校長去世前強推上位的，各國國王其實都怒不敢言
                          </div>
                        </div>
                      </div>

                      <div className="support-item">
                        <div className="support-avatar">卡修斯</div>
                        <div className="support-info">
                          <div className="support-char-name">✧ 卡修斯·塞西爾</div>
                          <div className="support-desc">
                            ✦ 希鷺倫的二王子<br />
                            ✦ 有野心並堅信自己未來會成為這個國家的國王<br />
                            ✦ 是真的會對自己的人民與政策有所行動，例如：提前制定社福政策、保護素未謀面的人民<br />
                            ✦ 喜歡艾蕾諾菈，並在明知她已訂婚的情況下試圖拉近距離。<br />
                            其實他只是認為艾蕾諾菈適合當王妃，但不自知那不是真的愛。
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trivia Note */}
                <div className="flex justify-center py-10">
                  <div 
                    className="trivia-note animate" 
                    style={{ transform: `rotate(${triviaRotation}deg)` }}
                  >
                    <div className="pin"></div>
                    <span className="trivia-tag">✧ TRIVIA 趣聞 ✧</span>
                    <div className="trivia-text">
                      {currentTrivia}
                    </div>
                    <div className="trivia-footer">———— Recorded by Observer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Library */}
        {activeTab === 'library' && (
          <div className="sub-page active">
            <Library />
          </div>
        )}

        {/* Tab: Art */}
        {activeTab === 'art' && (
          <div className="sub-page active">
            <div className={`gallery-outer ${selectedArt ? 'detail-mode' : ''}`}>
              <div className="gallery-title">༺ GALLERY ༻</div>
              <div className="scroll-container">
                {[
                  { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/IMG_5697.png' },
                  { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C951_20260118020109.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1067_20260118005441.png'] },
                  { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1749826495034.jpg' },
                  { type: 'complex', top: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1033_20260101025628.png', bottom: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235836.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1102_20260208235846.png'] },
                  { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1769782908274.jpg' },
                  { type: 'sq-pair', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250810153340.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C933_20250811052051.png'] },
                  { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C397_20251222082314.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C393_20251215195508.png'] },
                  { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1121_20260219211404.png' },
                  { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622181052.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C887_20250622210234.png'] },
                  { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216121552.png', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1016_20251216090827.png'] },
                  { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C878_20250614021733.png' },
                  { type: 'portrait', url: 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C1103_20260210015346.png' },
                  { type: 'stack', urls: ['https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/FB_IMG_1751735099362.jpg', 'https://raw.githubusercontent.com/dorastar0523/my-illustrations/main/%E7%84%A1%E6%A8%99%E9%A1%8C860_20250618164117.png'] }
                ].map((col, idx) => (
                  <div key={idx} className={`art-col col-${col.type}`}>
                    {col.type === 'portrait' && (
                      <div className={`art-frame ${selectedArt === col.url ? 'selected' : ''}`} onClick={() => setSelectedArt(selectedArt === col.url ? null : col.url)}>
                        <img src={col.url} alt="Art" referrerPolicy="no-referrer" />
                        {selectedArt === col.url && (
                          <div className="art-info-panel">
                            <div className="info-item"><span>作品名：</span></div>
                            <div className="info-item"><span>創作日期：</span></div>
                            <div className="info-item"><span>繪師：</span></div>
                          </div>
                        )}
                      </div>
                    )}
                    {(col.type === 'stack' || col.type === 'sq-pair') && col.urls.map((url, uidx) => (
                      <div key={uidx} className={`art-frame ${selectedArt === url ? 'selected' : ''}`} onClick={() => setSelectedArt(selectedArt === url ? null : url)}>
                        <img src={url} alt="Art" referrerPolicy="no-referrer" />
                        {selectedArt === url && (
                          <div className="art-info-panel">
                            <div className="info-item"><span>作品名：</span></div>
                            <div className="info-item"><span>創作日期：</span></div>
                            <div className="info-item"><span>繪師：</span></div>
                          </div>
                        )}
                      </div>
                    ))}
                    {col.type === 'complex' && (
                      <>
                        <div className={`art-frame top-frame ${selectedArt === col.top ? 'selected' : ''}`} onClick={() => setSelectedArt(selectedArt === col.top ? null : col.top)}>
                          <img src={col.top} alt="Art" referrerPolicy="no-referrer" />
                          {selectedArt === col.top && (
                            <div className="art-info-panel">
                              <div className="info-item"><span>作品名：</span></div>
                              <div className="info-item"><span>創作日期：</span></div>
                              <div className="info-item"><span>繪師：</span></div>
                            </div>
                          )}
                        </div>
                        <div className="row-inner">
                          {col.bottom.map((url, bidx) => (
                            <div key={bidx} className={`art-frame ${selectedArt === url ? 'selected' : ''}`} onClick={() => setSelectedArt(selectedArt === url ? null : url)}>
                              <img src={url} alt="Art" referrerPolicy="no-referrer" />
                              {selectedArt === url && (
                                <div className="art-info-panel">
                                  <div className="info-item"><span>作品名：</span></div>
                                  <div className="info-item"><span>創作日期：</span></div>
                                  <div className="info-item"><span>繪師：</span></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox flex"
            onClick={() => setLightboxImg(null)}
          >
            <img src={lightboxImg} alt="Zoomed" referrerPolicy="no-referrer" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
