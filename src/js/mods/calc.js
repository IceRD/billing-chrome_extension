import {desctop, Calendar} from './options.js'
// init config calendar
Calendar();

export const calc = () => {

	console.time("CALC");

	;(function () {

		if(!desctop){
			return;
		}

		class Calculator {
			theme = false;			// активность стилей
			block_account = {};		// блок лицевой счет
			current_balance = 0;	// текущее состояние счета
			current_total = 0;		// итого к оплате
			state_ether = false;	// статус активности учетной записи
			total_one_day = 0;		// абонплата за сутки
			paid_days = 0;			// оплачено дней по текущему балансу
			paid_days_new = 0;		// оплачено дней по сумме пополнения
			left_day = "";			// текст кол-ва дней
			pay_data_day = "";		// текущая дата оплаты
			input_sum = 0;			// сумма в наличии
			date_sum = 0;			// сумма к определенному дню
			delta = 0;				// кол-во дней от текущих суток
			day_end = false;		// выбрать дату оплаты
			msg = {
				"PAID_TO" : "Оплачено до:",
				"SELECT_PAYMENT_DAY" : "Выбрать дату оплаты:",
				"FREE_PAY_DAY" : "Абонплата за сутки:"
			};
			def = {
				popup: "#ShowHiddenPayment table#List tbody",
			};
			currency = "руб.";
				
			constructor(items){
				this.theme = items.theme ? true : false;
				this.block_account = $(`fieldset:contains('Лицевой счет')`);
				this.state_ether = !!$(this.block_account).find(`td:contains('Активен') + td`).text().match(/Активен/);
				this.current_balance = parseFloat($(this.block_account).find(`td:contains('Состояние счета') + td`).text().split(":").pop());
				this.current_total = this.FindCurrentToral();
				this.total_one_day = parseFloat((this.current_total / 30).toFixed(2));
				this.paid_days = this.CalcDay();
				this.left_day = this.LeftDays();
				this.pay_data_day = this.ShowDate();
			}

			FindCurrentToral(){
				let ct = this.theme 
					? $(this.block_account).find(`td:contains('Тарифный план')+td`)[0].innerText.split("\n")
					: $(this.block_account).find(`td:contains('Тарифный план')+td+td`)[0].innerText.split("\n");

				if(ct.length >= 3){
					ct = this.state_ether ? ct[2] : ct[1];
				}else{
					ct = ct[0];
				}

				return parseFloat(ct.split(":").pop()); 
			}

			PaidDays(){
				return Math.floor(this.current_balance / this.total_one_day);
			}

			CalcDay() {
				if (this.total_one_day > 0) {
					return this.input_sum ? Math.floor((this.current_balance + this.input_sum) / this.total_one_day) : Math.floor(this.current_balance / this.total_one_day);
				} else {
					return this.input_sum ? Math.floor((this.current_balance + this.input_sum)) : Math.floor(this.current_balance / 1);
				}
			}

			calcSum(){
				return this.delta > this.paid_days 
					?  Math.ceil((this.delta * this.total_one_day) - this.current_balance) 
					: 0;
			}

			LeftDays(){
				let day = this.paid_days_new ? this.paid_days_new : this.paid_days;

				const dayMeterings = ["день","дня","дней"];

				// http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html?id=l10n/pluralforms
				return dayMeterings[day % 10 == 1 && day % 100 != 11 ? 0 : day %10 >= 2 && day % 10 <= 4 && (day % 100 < 10 || day % 100 >= 20) ? 1 : 2];
			}

			ShowDate(t) {
				// [...Array(12)].map((n, i) => new Date(2019, i).toLocaleString('ru-Ru', { month: 'short' }));
				let day = this.paid_days_new ? this.paid_days_new : this.paid_days;
				const now = new Date();
				const month_arr = ["Января","Февраля","Марта","Апреля","Мая","Июня","Июля","Августа","Сентября","Октября","Ноября","Декабря"];
				now.setDate(now.getDate() + day);

				return !t 
					? `${now.getDate()} ${month_arr[now.getMonth()]} ${now.getFullYear()}` 
					: `${now.getFullYear()} - ${now.getMonth()} - ${now.getDate()}`;
			}

			getDayDelta(){
				const incomingDate = this.day_end ? new Date(this.day_end.replace("-/g"," ")) : new Date();
				incomingDate.setHours(0);
				incomingDate.setMinutes(0);
				incomingDate.setSeconds(0);
				incomingDate.setMilliseconds(0);

				const today = new Date();
				today.setHours(0);
				today.setMinutes(0);
				today.setSeconds(0);
				today.setMilliseconds(0);

				const delta = incomingDate - today;

				return Math.round(delta / 1000 / 60 / 60 / 24);
			}

			CreateTemplate(){ 
				return `<tr class="bg-calc">
					<td>${this.msg["PAID_TO"]}</td>
					<td style="position:relative;"><span id="pay_day">${this.pay_data_day} (${this.paid_days} ${this.left_day})</span><span id="addition" style="position:absolute;top: 5px; right:5px; cursor:pointer;"><i style="height: 15px;width: 15px;" class="ico ico--plus"></i></span></td>
				</tr>
				<tr style="display:none;" class="addition bg-calc">
					<td>${this.msg["SELECT_PAYMENT_DAY"]}</td>
					<td colspan="2" id="data"><input type="text" id="datepicker" class="datepicker-here" value="" placeholder="0000-00-00" autocomplete="off" class="input-group"><span id="calc_date">0 ${this.currency}</span></td>
				</tr>
				<tr style="display:none;" class="addition bg-calc">
					<td>${this.msg["FREE_PAY_DAY"]}</td>
					<td colspan="2" id="one_day">${this.total_one_day} ${this.currency} </td>
				</tr>`
			}

			ChangeSum(v){
				let value = parseFloat(v);
				this.input_sum = value ? value : 0;
				this.paid_days_new = this.CalcDay();
				this.left_day = this.LeftDays();
				this.pay_data_day = this.ShowDate();
				document.querySelector("#pay_day").innerHTML = `${this.pay_data_day} (${this.paid_days_new} ${this.left_day})`;
			}

			ChangeDate(date){
				this.day_end = date;
				this.delta = this.getDayDelta();
				this.date_sum = this.calcSum();
				document.querySelector("#calc_date").innerHTML = `${this.date_sum} ${this.currency}`;
			}

			initTemplate(){
				
				$(this.def.popup).prepend(this.CreateTemplate());

				document.querySelector("#addition").onclick = function(){

					//getComputedStyle(document.querySelector('.addition'), null).display

					let el = document.querySelector('.addition');
					el.style.display = el.style.display ? '' : 'none';

					document.querySelector('#addition i').classList.toggle("ico--plus", "ico--minus");
				}

				document.querySelector("#summa2").oninput = (e) =>{
					this.ChangeSum(e.target.value);
				}
					
				$(`#datepicker`).alter_datepicker({
					minDate: new Date(),
					onSelect: (e) => {
						this.ChangeDate(e);
					},
				});

			}

		}

		const getState = () => {
			return new Promise((resolve, reject) => {
				chrome.storage.sync.get(["calc","theme"], items => {
					if (items.calc) {
						resolve(items);
					}else{
						reject('storage calc is empty');
					}
				});
			});
		}

		getState().then(items =>{	

			let Calc = new Calculator(items);
			Calc.initTemplate();

			console.log(Calc);

		}).catch((e)=>{

			throw new Error(e);
		});

	}());

	console.timeEnd("CALC");
	
}
