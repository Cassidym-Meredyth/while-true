import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Work = { id: number; title: string; desc: string };

@Component({
  standalone: true,
  selector: 'app-dicts-page',
  imports: [CommonModule],
  templateUrl: './dicts.page.html',
  styleUrls: ['./dicts.page.css'],
})
export class DictsPage {
  q = '';
  works: Work[] = [
    {
      id: 1,
      title: 'Закладка фундамента',
      desc: 'Очень важное красим красками и лакируем лаками',
    },
    { id: 2, title: 'Покраска', desc: 'Заложение фундамента на объекте' },
    { id: 3, title: 'Укладка плитки', desc: 'Заложение фундамента на объекте' },
    {
      id: 4,
      title: 'Установка вентиляции',
      desc: 'Заложение фундамента на объекте',
    },
  ];
  remark: string[] = ['Техника безопасности', 'Сроки', 'Качество'];

  filteredWorks() {
    const s = this.q.trim().toLowerCase();
    if (!s) return this.works;
    return this.works.filter(
      (w) =>
        w.title.toLowerCase().includes(s) || w.desc.toLowerCase().includes(s)
    );
  }
  trackById = (_: number, w: Work) => w.id;

  addWork() {
    this.works = [
      ...this.works,
      {
        id: (this.works.at(-1)?.id ?? 0) + 1,
        title: 'Новый вид работ',
        desc: 'Описание',
      },
    ];
  }
  addRemarkType() {
    this.remark = [...this.remark, `Тип ${this.remark.length + 1}`];
  }
}
