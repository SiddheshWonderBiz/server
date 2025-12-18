import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Role, Status } from '@prisma/client';

@Injectable()
export class AppointmentService {
    constructor(private prismaService : PrismaService){}

    async createAppointment(dto : CreateAppointmentDto , user : {id : number , role : Role}){
        if(user.role !== Role.CLIENT){
            throw new ForbiddenException('Only clients can create appointments');
        }

        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);
        if(startAt >= endAt){
            throw new ForbiddenException('Invalid appointment time range');
        }

        const day = startAt.getDay();
        if(day === 0){
            throw new ForbiddenException('Appointments cannot be scheduled on Sundays');
        }

        const startHour = startAt.getHours();
        const endHour = endAt.getHours();

        if ( startHour  < 10 || endHour > 19 ){
            throw new ForbiddenException('Appointments must be between 10 AM and 7 PM');
        }

        const conflict = await this.prismaService.appointment.findFirst({
            where:{
                consultantId : dto.consultantId,
                status:{
                    in : [Status.PENDING , Status.SCHEDULED]
                },
                AND:[
                    { startAt : { lt : endAt}},
                    { endAt : { gt : startAt}}
                ]
            }
        });
        if(conflict){
            throw new ForbiddenException('The consultant is not available during the selected time slot');
        }

        const appointment = await this.prismaService.appointment.create({
            data:{
                consultantId : dto.consultantId,
                clientId : user.id,
                startAt,
                endAt,
                purpose : dto.purpose,
                status : Status.PENDING
            }
        })

        return appointment;
    }


    //get looged in user's appointments
    async myAppointments(user : { id: number; role: Role }){

        if (user.role !== Role.CLIENT){
            throw new ForbiddenException('Only clients can view their appointments');
        }

        const appointments = await this.prismaService.appointment.findMany({
            where:{
                clientId : user.id
            },
            orderBy:{
                startAt : 'asc'
            }
        });
        return appointments;
    }

    async consultantAppointments(user : { id: number; role: Role }){

        if (user.role !== Role.CONSULTANT){
            throw new ForbiddenException('Only consultants can view their appointments');
        }
        const appointments = await this.prismaService.appointment.findMany({
            where:{
                consultantId : user.id,
                status: {in: [Status.SCHEDULED , Status.PENDING]}
            },
            orderBy:{
                startAt : 'asc'
            }
        });
        return appointments;
    }

    
}
