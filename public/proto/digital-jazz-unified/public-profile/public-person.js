(()=>{
 const name=new URLSearchParams(location.search).get('name');if(!name)return;
 const judges={'Судья Пульс':'judge-mclis','Судья Контур':'judge-iv','Судья Искра':'judge-arina','Судья Вектор':'judge-tactics','Судья Спектр':'judge-chagin'};
 const match=name.match(/^Участник ([A-H])$/);const key=judges[name]||(match?'participant-'+match[1].toLowerCase():null);if(!key)return;
 document.querySelector('.name').textContent=name;document.title=name+' · Публичный профиль';
 const cover=document.querySelector('[data-id="profile"] .cover img');if(cover){cover.src='../assets/portraits/'+key+'.png';cover.alt='Иллюстративный портрет: '+name;cover.style.objectPosition='center 30%';}
 document.querySelectorAll('.write-hint,.rider-locked-text').forEach(el=>el.textContent=el.textContent.replaceAll('Судья Вектор',name));
 const bios=document.querySelectorAll('.bio-text');bios.forEach((el,i)=>{el.textContent=i===0?'Публичный профиль '+name+'. Биография пока не добавлена.':'';if(i>0)el.hidden=true;});
 const tags=document.querySelector('[data-id="profile"] .tags');if(tags){tags.replaceChildren();const tag=document.createElement('div');tag.className='tag';tag.textContent=judges[name]?'Судья турниров':'Участник турниров';tags.append(tag);}
 const online=document.querySelector('.online-row');if(online)online.hidden=true;
 const title=document.querySelector('.name');const note=document.createElement('p');note.className='write-hint';note.textContent='Демонстрационный профиль. Портрет — иллюстрация; остальные разделы содержат примеры оформления.';title.insertAdjacentElement('afterend',note);
 const back=document.createElement('a');back.href='../person.html?name='+encodeURIComponent(name)+'#tournaments';back.textContent='← К участию в турнирах';back.style.cssText='display:block;margin:0 0 16px;color:#C7C3D6;font-size:17px';document.querySelector('#cardList').prepend(back);
})();
