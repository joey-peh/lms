import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CardComponent } from '../card/card.component';
CardComponent
@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor(private http: HttpClient) { }

  getEnrolmentData(){
    return this.http.get('assets/csv.csv', {responseType: 'text'});
  }
}
