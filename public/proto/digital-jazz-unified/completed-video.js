/* Explicit sample results, not an assessment of the supplied videos. */
const beforeCompletedVideo=roleBody;
roleBody=function(id){
 if(id!==4)return beforeCompletedVideo(id);
 const results=`<section class="role-panel"><h3>${tournamentStatus('Турнир завершён','ready')}</h3><p class="caption">Демонстрационные оценки и места для проверки интерфейса, не реальная оценка видео.</p><div class="judge-comparison"><table><thead><tr><th>Место</th><th>Участник</th><th>Судья Пульс</th><th>Судья Контур</th><th>Итого</th></tr></thead><tbody><tr><td>1</td><th>Участник B</th><td>13</td><td>13</td><td>26 / 30</td></tr><tr><td>2</td><th>Участник A</th><td>12</td><td>11</td><td>23 / 30</td></tr></tbody></table></div><p class="caption">Сумма оценок двух судей по трём критериям, каждый от 1 до 5.</p>${pageRole==='Участник'?'<p class="secondary">Твой результат: 2-е место · 23 / 30</p>':''}<p class="secondary">Приз участника B: разбор работы · демо</p></section>`;
 if(pageRole==='Судья')return results+judgeMonitor(id);
 return results+`<section class="role-panel"><h3>Работы участников</h3>${[['B','magnetic-demo.mp4'],['A','beat-demo.mp4']].map(([name,file])=>`<div class="demo-work"><div class="battle-roster-person">${djPortrait('Участник '+name)}<h3>${djPersonName('Участник '+name)}</h3></div><video controls playsinline preload="metadata" src="assets/${file}" aria-label="Работа участника ${name}"></video></div>`).join('')}</section>`;
};
render();
