import { Component, OnInit } from '@angular/core';

declare var Swiper: any; // Import Swiper from the global scope

@Component({
    selector: 'wed-bio-page',
    templateUrl: './bio.page.html',
    styleUrls: ['./bio.page.scss'],
    imports: [],
})
export default class BioPage implements OnInit {
    readonly images = ['rr_one.jpeg', 'rr_two.jpg', 'rr_three.jpeg', 'rr_four.jpeg', 'rr_five.jpeg', 'rr_six.jpeg', 'rr_seven.jpeg', 'rr_eight.jpeg', 'rr_nine.jpeg'];

    ngOnInit(): void {
        setTimeout(() => this.loadSwiper(), 0);
    }

    private loadSwiper(): void {
        var swiper = new Swiper('.swiper-container', {
            slidesPerView: 'auto',
            spaceBetween: 0, //if you set the value other than 0, you will get some bug when viewport is resized, use CSS instead
            centeredSlides: true,
            grabCursor: true,
            // loop: 'auto',
            // parallax: true,
            // effect: 'coverflow',
            // coverflowEffect: {
            //     rotate: 0,
            //     stretch: 10,
            //     depth: 10,
            //     scale: 0.8,
            //     modifier: 1,
            //     slideShadows: false,
            // },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }
}
