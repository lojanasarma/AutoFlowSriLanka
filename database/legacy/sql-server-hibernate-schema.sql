
    create table audit_log (
        actor_id int not null,
        audit_id int identity not null,
        occurred_at datetime2(6),
        action varchar(50) not null,
        entity varchar(50) not null,
        new_value varchar(max),
        old_value varchar(max),
        primary key (audit_id)
    );

    create table bay (
        bay_id int identity not null,
        centre_id int not null,
        status varchar(20),
        name varchar(50) not null,
        primary key (bay_id)
    );

    create table booking (
        booking_id int identity not null,
        centre_id int not null,
        customer_id int not null,
        slot_id int not null,
        vehicle_id int not null,
        created_at datetime2(6),
        status varchar(20),
        ref varchar(50) not null,
        service_type varchar(50) not null,
        primary key (booking_id)
    );

    create table centre (
        centre_id int identity not null,
        name varchar(100) not null,
        location varchar(255) not null,
        primary key (centre_id)
    );

    create table customer (
        customer_id int not null,
        loyalty_points int,
        primary key (customer_id)
    );

    create table fuel_log (
        cost numeric(10,2),
        log_id int identity not null,
        odometer int,
        quantity numeric(10,2),
        station_id int not null,
        vehicle_id int not null,
        recorded_at datetime2(6),
        fuel_type varchar(20) not null,
        status varchar(20),
        primary key (log_id)
    );

    create table fuel_station (
        station_id int identity not null,
        name varchar(100) not null,
        location varchar(255) not null,
        primary key (station_id)
    );

    create table invoice (
        amount numeric(10,2),
        invoice_id int identity not null,
        payment_id int not null,
        issued_at datetime2(6),
        status varchar(20),
        primary key (invoice_id)
    );

    create table notification (
        notif_id int identity not null,
        template_id int not null,
        user_id int not null,
        created_at datetime2(6),
        channel varchar(20),
        status varchar(20),
        primary key (notif_id)
    );

    create table payment (
        amount numeric(10,2),
        booking_id int not null,
        payment_id int identity not null,
        attempted_at datetime2(6),
        verified_at datetime2(6),
        status varchar(20),
        method varchar(50),
        provider_ref varchar(100),
        primary key (payment_id)
    );

    create table refund (
        amount numeric(10,2),
        decided_by int not null,
        payment_id int not null,
        refund_id int identity not null,
        status varchar(20),
        reason varchar(max) not null,
        primary key (refund_id)
    );

    create table service_history (
        booking_id int not null,
        history_id int identity not null,
        mileage int,
        vehicle_id int not null,
        completed_at datetime2(6) not null,
        notes varchar(max),
        primary key (history_id)
    );

    create table staff (
        staff_id int not null,
        department varchar(50) not null,
        primary key (staff_id)
    );

    create table template (
        template_id int identity not null,
        status varchar(20),
        type varchar(50) not null,
        subject varchar(100) not null,
        body varchar(max) not null,
        primary key (template_id)
    );

    create table time_slot (
        bay_id int not null,
        centre_id int not null,
        slot_id int identity not null,
        end_at datetime2(6) not null,
        start_at datetime2(6) not null,
        status varchar(20),
        primary key (slot_id)
    );

    create table users (
        user_id int identity not null,
        mobile varchar(15) not null,
        status varchar(20),
        role varchar(50),
        email varchar(100) not null,
        full_name varchar(100) not null,
        password_hash varchar(255) not null,
        primary key (user_id)
    );

    create table vehicle (
        engine_capacity int,
        insurance_expiry date not null,
        mileage int,
        owner_id int not null,
        vehicle_id int identity not null,
        year int,
        fuel_type varchar(20),
        reg_no varchar(20) not null,
        status varchar(20),
        make varchar(50) not null,
        model varchar(50) not null,
        primary key (vehicle_id)
    );

    create table vehicle_document (
        doc_id int identity not null,
        expiry_date date not null,
        vehicle_id int not null,
        status varchar(20),
        type varchar(50) not null,
        primary key (doc_id)
    );

    create table waiting_list (
        booking_id int not null,
        wait_id int identity not null,
        preferred_slot datetime2(6) not null,
        status varchar(20),
        primary key (wait_id)
    );

    alter table booking 
       add constraint UKj41u93mer3wyyjybk5aeikbwt unique (ref);

    alter table invoice 
       add constraint UK5vvlr4mmb6jbwiu4dyqwevd0d unique (payment_id);

    create unique nonclustered index UKb8werpie0qg1wtr0oat30e0sx 
       on payment (provider_ref) where provider_ref is not null;

    alter table users 
       add constraint UK63cf888pmqtt5tipcne79xsbm unique (mobile);

    alter table users 
       add constraint UK6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table vehicle 
       add constraint UKhdlbhro6ggegdmuqc8v2xl8q7 unique (reg_no);

    alter table audit_log 
       add constraint FKp0xyrkkoeraheio5qt1iihlo1 
       foreign key (actor_id) 
       references users;

    alter table bay 
       add constraint FK66qfk1of83gv73to13ubulhxo 
       foreign key (centre_id) 
       references centre;

    alter table booking 
       add constraint FKmqotrafykw67bx0oxewi9fnxp 
       foreign key (centre_id) 
       references centre;

    alter table booking 
       add constraint FKlnnelfsha11xmo2ndjq66fvro 
       foreign key (customer_id) 
       references customer;

    alter table booking 
       add constraint FKss0h2aq4ggglgwylpr7blbec6 
       foreign key (slot_id) 
       references time_slot;

    alter table booking 
       add constraint FKejehywt60rdh29uvn8ejths82 
       foreign key (vehicle_id) 
       references vehicle;

    alter table customer 
       add constraint FKp58mlvaqwr6aqoc9oe9auhwk0 
       foreign key (customer_id) 
       references users;

    alter table fuel_log 
       add constraint FKpylwc2j1oj33mt1hym4i2aojd 
       foreign key (station_id) 
       references fuel_station;

    alter table fuel_log 
       add constraint FK87s6ms0vswc3qnn1iqj2wqo5d 
       foreign key (vehicle_id) 
       references vehicle;

    alter table invoice 
       add constraint FKbaxa82hce5x7dqj0sotnc1cxf 
       foreign key (payment_id) 
       references payment;

    alter table notification 
       add constraint FKiwlh3482klkkb02l15mhq4cf9 
       foreign key (template_id) 
       references template;

    alter table notification 
       add constraint FKnk4ftb5am9ubmkv1661h15ds9 
       foreign key (user_id) 
       references users;

    alter table payment 
       add constraint FKqewrl4xrv9eiad6eab3aoja65 
       foreign key (booking_id) 
       references booking;

    alter table refund 
       add constraint FKtcr641ptotq3dkdxhhavd1v1w 
       foreign key (decided_by) 
       references staff;

    alter table refund 
       add constraint FKeoh1147brjy6m009cswl5lty4 
       foreign key (payment_id) 
       references payment;

    alter table service_history 
       add constraint FKhf8xkpb2j28ib0186amq94v5n 
       foreign key (booking_id) 
       references booking;

    alter table service_history 
       add constraint FK2u0hkud4mw720h6ks1l8phn7d 
       foreign key (vehicle_id) 
       references vehicle;

    alter table staff 
       add constraint FKdb7iapv23chqgotel5wy2s5y6 
       foreign key (staff_id) 
       references users;

    alter table time_slot 
       add constraint FK6thmvq35m5vwu3sv93g19fjq5 
       foreign key (bay_id) 
       references bay;

    alter table time_slot 
       add constraint FKbbmmm49mljgk9nfeynp1o4m2m 
       foreign key (centre_id) 
       references centre;

    alter table vehicle 
       add constraint FKm2gu7jsq6n46q1e76ja64klc0 
       foreign key (owner_id) 
       references customer;

    alter table vehicle_document 
       add constraint FKcldglkwkdd1pqlxjdc1xu47ht 
       foreign key (vehicle_id) 
       references vehicle;

    alter table waiting_list 
       add constraint FKni1yxtkc2k2u8x6usyrelrb5m 
       foreign key (booking_id) 
       references booking;

    create table audit_log (
        actor_id int not null,
        audit_id int identity not null,
        occurred_at datetime2(6),
        action varchar(50) not null,
        entity varchar(50) not null,
        new_value varchar(max),
        old_value varchar(max),
        primary key (audit_id)
    );

    create table bay (
        bay_id int identity not null,
        centre_id int not null,
        status varchar(20),
        name varchar(50) not null,
        primary key (bay_id)
    );

    create table booking (
        booking_id int identity not null,
        centre_id int not null,
        customer_id int not null,
        slot_id int not null,
        vehicle_id int not null,
        created_at datetime2(6),
        status varchar(20),
        ref varchar(50) not null,
        service_type varchar(50) not null,
        primary key (booking_id)
    );

    create table centre (
        centre_id int identity not null,
        name varchar(100) not null,
        location varchar(255) not null,
        primary key (centre_id)
    );

    create table customer (
        customer_id int not null,
        loyalty_points int,
        primary key (customer_id)
    );

    create table fuel_log (
        cost numeric(10,2),
        log_id int identity not null,
        odometer int,
        quantity numeric(10,2),
        station_id int not null,
        vehicle_id int not null,
        recorded_at datetime2(6),
        fuel_type varchar(20) not null,
        status varchar(20),
        primary key (log_id)
    );

    create table fuel_station (
        station_id int identity not null,
        name varchar(100) not null,
        location varchar(255) not null,
        primary key (station_id)
    );

    create table invoice (
        amount numeric(10,2),
        invoice_id int identity not null,
        payment_id int not null,
        issued_at datetime2(6),
        status varchar(20),
        primary key (invoice_id)
    );

    create table notification (
        notif_id int identity not null,
        template_id int not null,
        user_id int not null,
        created_at datetime2(6),
        channel varchar(20),
        status varchar(20),
        primary key (notif_id)
    );

    create table payment (
        amount numeric(10,2),
        booking_id int not null,
        payment_id int identity not null,
        attempted_at datetime2(6),
        verified_at datetime2(6),
        status varchar(20),
        method varchar(50),
        provider_ref varchar(100),
        primary key (payment_id)
    );

    create table refund (
        amount numeric(10,2),
        decided_by int not null,
        payment_id int not null,
        refund_id int identity not null,
        status varchar(20),
        reason varchar(max) not null,
        primary key (refund_id)
    );

    create table service_history (
        booking_id int not null,
        history_id int identity not null,
        mileage int,
        vehicle_id int not null,
        completed_at datetime2(6) not null,
        notes varchar(max),
        primary key (history_id)
    );

    create table staff (
        staff_id int not null,
        department varchar(50) not null,
        primary key (staff_id)
    );

    create table template (
        template_id int identity not null,
        status varchar(20),
        type varchar(50) not null,
        subject varchar(100) not null,
        body varchar(max) not null,
        primary key (template_id)
    );

    create table time_slot (
        bay_id int not null,
        centre_id int not null,
        slot_id int identity not null,
        end_at datetime2(6) not null,
        start_at datetime2(6) not null,
        status varchar(20),
        primary key (slot_id)
    );

    create table users (
        user_id int identity not null,
        mobile varchar(15) not null,
        status varchar(20),
        role varchar(50),
        email varchar(100) not null,
        full_name varchar(100) not null,
        password_hash varchar(255) not null,
        primary key (user_id)
    );

    create table vehicle (
        engine_capacity int,
        insurance_expiry date not null,
        mileage int,
        owner_id int not null,
        vehicle_id int identity not null,
        year int,
        fuel_type varchar(20),
        reg_no varchar(20) not null,
        status varchar(20),
        make varchar(50) not null,
        model varchar(50) not null,
        primary key (vehicle_id)
    );

    create table vehicle_document (
        doc_id int identity not null,
        expiry_date date not null,
        vehicle_id int not null,
        status varchar(20),
        type varchar(50) not null,
        primary key (doc_id)
    );

    create table waiting_list (
        booking_id int not null,
        wait_id int identity not null,
        preferred_slot datetime2(6) not null,
        status varchar(20),
        primary key (wait_id)
    );

    alter table booking 
       add constraint UKj41u93mer3wyyjybk5aeikbwt unique (ref);

    alter table invoice 
       add constraint UK5vvlr4mmb6jbwiu4dyqwevd0d unique (payment_id);

    create unique nonclustered index UKb8werpie0qg1wtr0oat30e0sx 
       on payment (provider_ref) where provider_ref is not null;

    alter table users 
       add constraint UK63cf888pmqtt5tipcne79xsbm unique (mobile);

    alter table users 
       add constraint UK6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table vehicle 
       add constraint UKhdlbhro6ggegdmuqc8v2xl8q7 unique (reg_no);

    alter table audit_log 
       add constraint FKp0xyrkkoeraheio5qt1iihlo1 
       foreign key (actor_id) 
       references users;

    alter table bay 
       add constraint FK66qfk1of83gv73to13ubulhxo 
       foreign key (centre_id) 
       references centre;

    alter table booking 
       add constraint FKmqotrafykw67bx0oxewi9fnxp 
       foreign key (centre_id) 
       references centre;

    alter table booking 
       add constraint FKlnnelfsha11xmo2ndjq66fvro 
       foreign key (customer_id) 
       references customer;

    alter table booking 
       add constraint FKss0h2aq4ggglgwylpr7blbec6 
       foreign key (slot_id) 
       references time_slot;

    alter table booking 
       add constraint FKejehywt60rdh29uvn8ejths82 
       foreign key (vehicle_id) 
       references vehicle;

    alter table customer 
       add constraint FKp58mlvaqwr6aqoc9oe9auhwk0 
       foreign key (customer_id) 
       references users;

    alter table fuel_log 
       add constraint FKpylwc2j1oj33mt1hym4i2aojd 
       foreign key (station_id) 
       references fuel_station;

    alter table fuel_log 
       add constraint FK87s6ms0vswc3qnn1iqj2wqo5d 
       foreign key (vehicle_id) 
       references vehicle;

    alter table invoice 
       add constraint FKbaxa82hce5x7dqj0sotnc1cxf 
       foreign key (payment_id) 
       references payment;

    alter table notification 
       add constraint FKiwlh3482klkkb02l15mhq4cf9 
       foreign key (template_id) 
       references template;

    alter table notification 
       add constraint FKnk4ftb5am9ubmkv1661h15ds9 
       foreign key (user_id) 
       references users;

    alter table payment 
       add constraint FKqewrl4xrv9eiad6eab3aoja65 
       foreign key (booking_id) 
       references booking;

    alter table refund 
       add constraint FKtcr641ptotq3dkdxhhavd1v1w 
       foreign key (decided_by) 
       references staff;

    alter table refund 
       add constraint FKeoh1147brjy6m009cswl5lty4 
       foreign key (payment_id) 
       references payment;

    alter table service_history 
       add constraint FKhf8xkpb2j28ib0186amq94v5n 
       foreign key (booking_id) 
       references booking;

    alter table service_history 
       add constraint FK2u0hkud4mw720h6ks1l8phn7d 
       foreign key (vehicle_id) 
       references vehicle;

    alter table staff 
       add constraint FKdb7iapv23chqgotel5wy2s5y6 
       foreign key (staff_id) 
       references users;

    alter table time_slot 
       add constraint FK6thmvq35m5vwu3sv93g19fjq5 
       foreign key (bay_id) 
       references bay;

    alter table time_slot 
       add constraint FKbbmmm49mljgk9nfeynp1o4m2m 
       foreign key (centre_id) 
       references centre;

    alter table vehicle 
       add constraint FKm2gu7jsq6n46q1e76ja64klc0 
       foreign key (owner_id) 
       references customer;

    alter table vehicle_document 
       add constraint FKcldglkwkdd1pqlxjdc1xu47ht 
       foreign key (vehicle_id) 
       references vehicle;

    alter table waiting_list 
       add constraint FKni1yxtkc2k2u8x6usyrelrb5m 
       foreign key (booking_id) 
       references booking;
