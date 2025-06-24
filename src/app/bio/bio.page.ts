import { Component, OnInit } from '@angular/core';

declare var Swiper: any; // Import Swiper from the global scope

@Component({
    selector: 'wed-bio-page',
    templateUrl: './bio.page.html',
    styleUrls: ['./bio.page.scss'],
    imports: [],
})
export default class BioPage implements OnInit {
    readonly images = ['rr_one.jpeg', 'rr_two.jpg', 'rr_three.jpeg', 'rr_four.jpeg', 'rr_five.jpeg', 'rr_six.jpeg', 'rr_ten.jpeg', 'rr_seven.jpeg', 'rr_eight.jpeg', 'rr_nine.jpeg'];

    ngOnInit(): void {
        setTimeout(() => this.loadSwiper(), 0);
    }

    private loadSwiper(): void {
        new Swiper('.swiper-container', {
            slidesPerView: 'auto',
            spaceBetween: 10,
            grabCursor: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }
}
