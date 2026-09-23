'use strict';
/* v58 — публичные турниры других организаторов для ленты «Смотрю» (главная и страницы турниров зрителя).
   На страницах ролей не подключается: там только турниры, где у человека есть роль. */
(()=>{
const R8=['Участник A','Участник B','Участник C','Участник D','Участник E','Участник F','Участник G','Участник H'];
const list=[
 {id:3,dates:'8–26 окт',name:'Vocal Arena',format:'Пирамида',category:'Вокал',count:8,pairing:'Случайно',organizer:'Vocal Community',cover:'gerls',coverClass:'crop-left',
  description:'Восемь вокалистов, три этапа. Публичный турнир сообщества Vocal Community.',material:'Видео',orientation:'Вертикальное',
  criteria:['Техника','Подача','Оригинальность'],judges:['Судья Искра','Судья Контур'],prizes:[{place:1,text:'Запись сингла в студии'},{place:2,text:'Сессия с вокальным педагогом'}],
  tasks:[['1/4 финала',3,'Куплет и припев любой песни, до 90 секунд, вертикальное видео.'],['1/2 финала',3,'Кавер в новом жанре.'],['Финал',4,'Авторская песня или авторская аранжировка.']],roster:R8,phase:2,highlight:'Организатор · Vocal Community'},
 {id:5,dates:'11–19 окт',name:'Гитарный поединок',format:'1 на 1',category:'Гитара',count:2,pairing:'Вручную',organizer:'Strings Club',cover:'guinar',
  description:'Два гитариста, одна тема: соло на общий бэкинг-трек.',material:'Видео',orientation:'Горизонтальное',
  criteria:['Техника','Звук','Идея'],judges:['Судья Спектр','Судья Вектор'],prizes:[{place:1,text:'Педалборд от партнёра'}],
  tasks:[['Соло',4,'Соло до 2 минут на общий бэкинг-трек, одна камера, без монтажа.']],roster:['Участник C','Участник D'],phase:1,highlight:'Приз · педалборд от партнёра'},
 {id:6,dates:'20 окт – 2 ноя',name:'Брейк-круг',format:'Открытый',category:'Танцы',count:12,roundCount:2,organizer:'Floor Kings',cover:'dance',
  description:'Открытый баттл брейкеров: два раунда, лучшие проходят в финальный круг.',material:'Видео',orientation:'Вертикальное',
  criteria:['Техника','Музыкальность','Стиль'],judges:['Судья Искра','Судья Пульс'],prizes:[{place:1,text:'Поездка на фестиваль'},{place:2,text:'Кроссовки от партнёра'}],
  tasks:[['Раунд 1',5,'Выход до 60 секунд под общий трек.'],['Финальный круг',3,'Выход до 90 секунд, свободный трек.']],roster:R8.slice(0,6),phase:0,highlight:'Заявки до 20 окт'},
 {id:7,dates:'9–22 окт',name:'Панчлайн',format:'Пирамида',category:'Рэп',count:8,pairing:'Случайно',organizer:'Rhyme Lab',cover:'rap',
  description:'Рэп-баттл на заданный бит: восемь МС, пары по сетке.',material:'Аудио',orientation:'Любое',
  criteria:['Текст','Флоу','Подача'],judges:['Судья Вектор','Судья Пульс'],prizes:[{place:1,text:'Сведение и мастеринг трека'}],
  tasks:[['1/4 финала',3,'Куплет 16 строк на общий бит.'],['1/2 финала',3,'Ответ сопернику, 16 строк.'],['Финал',3,'Трек целиком.']],roster:R8,phase:2,highlight:'Судьи · Судья Вектор и Судья Пульс',
  work:{name:'Участник A · 1/4 финала · демо-фрагмент',type:'audio/wav',url:'assets/demo-beat.wav'}}];
list.forEach(x=>{if(!tournamentExamples.some(t=>t.id===x.id))tournamentExamples.push(x);const d=demoFor(x.id);d.role='Зритель';d.phase=x.phase;if(x.work)d.work=x.work;});
{const d=demoFor(0);d.phase=2;}
window.djPublicTournaments=list;
})();
