import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Role } from '@prisma/client';

@Controller('appointment')
export class AppointmentController {
    constructor(private appointmentService : AppointmentService){}

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createAppointment(@CurrentUser() user : { id: number; role: Role } , @Body() dto : CreateAppointmentDto){
        return this.appointmentService.createAppointment(
           dto , user
        );
    }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    async myAppointments(@CurrentUser() user : { id: number; role: Role }){
        return this.appointmentService.myAppointments(user);
    }


    @UseGuards(JwtAuthGuard)
    @Get('consultant')
    async consultantAppointments(@CurrentUser() user : { id: number; role: Role }){
        return this.appointmentService.consultantAppointments(user);
    }
}
